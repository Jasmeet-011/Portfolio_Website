import { answer, type Context } from "./answer.js";
import { clientIp, limiterKey } from "./ip.js";
import { pacificDay, type Limiter } from "./limits.js";
import { consoleFailureLogger, type FailureLog, type FailureLogger } from "./log.js";
import { PROMPT_VERSION } from "./prompt.js";
import {
  LIMITS,
  type AssistantRequest,
  type Availability,
  type ChatTurn,
  type ErrorBody,
  type Quota,
  type StreamEvent,
  type Trace,
} from "./protocol.js";
import { ProviderError, type Provider } from "./provider/index.js";
import {
  ANSWER_TTL_SECONDS,
  type AnswerCache,
  type QuestionLog,
  type QuotaLatch,
} from "./store.js";

export interface Deps {
  /** Null when the assistant isn't configured (no API key): every request gets 503. */
  provider: Provider | null;
  perIp: Limiter;
  /** Repeat clicks on cached suggested questions. */
  cachedPerIp: Limiter;
  /** Everyone, per minute: a little under the provider's per-minute limit. */
  perMinute: Limiter;
  /** Everyone, per Pacific day: a little under the provider's daily quota. */
  global: Limiter;
  /** Set when the provider reports its daily quota used up. */
  latch: QuotaLatch;
  cache: AnswerCache;
  log: QuestionLog;
  context: Context;
  onVercel: boolean;
  ipSalt: string;
  now: () => number;
  /** Structured failure logs (./log.ts). Defaults to the console, which Vercel collects. */
  failures?: FailureLogger;
}

export const DAILY_MESSAGE =
  "The assistant is done for today. Everything it knows is in these files.";
export const BUSY_MESSAGE = "The assistant is busy. Try again in a minute.";
export const UNAVAILABLE_MESSAGE =
  "The assistant isn't available right now. Everything it knows is in these files.";

const json = (status: number, body: ErrorBody | Availability) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const toQuota = (r: { limit: number; remaining: number; reset: number }): Quota => ({
  limit: r.limit,
  remaining: r.remaining,
  resetAt: r.reset,
});

type Parsed =
  | { kind: "question"; question: string; history: ChatTurn[] }
  | { kind: "chip"; chipId: string; question: string };

/** Validates the body. Anything unexpected is a 400, never a model call. */
function parse(raw: unknown, context: Context): Parsed | string {
  if (typeof raw !== "object" || raw === null) return "Send a JSON object.";
  const body = raw as AssistantRequest;
  if (typeof body.chipId === "string") {
    const chip = context.suggestions.find((s) => s.id === body.chipId);
    return chip
      ? { kind: "chip", chipId: chip.id, question: chip.question }
      : "Unknown suggested question.";
  }
  if (typeof body.question !== "string") return "Ask a question.";
  const question = body.question.trim();
  if (!question) return "Ask a question.";
  if (question.length > LIMITS.questionChars)
    return `Questions can be up to ${LIMITS.questionChars} characters.`;
  const history = body.history ?? [];
  if (!Array.isArray(history) || history.length > LIMITS.historyMessages)
    return "Too much history.";
  for (const [i, turn] of history.entries()) {
    const expected = i % 2 === 0 ? "user" : "assistant";
    if (
      typeof turn !== "object" ||
      turn === null ||
      turn.role !== expected ||
      typeof turn.text !== "string" ||
      turn.text.length > LIMITS.historyMessageChars
    )
      return "History must alternate user and assistant turns.";
  }
  if (history.length % 2 !== 0) return "History must end with an assistant turn.";
  return { kind: "question", question, history };
}

/** The assistant endpoint as a web-standard handler, so Vercel and the dev server share it. */
export function createHandler(deps: Deps) {
  return async function handle(request: Request): Promise<Response> {
    // Whether the assistant is configured, for the page to check on load. Always 200, and
    // it touches no limit or store, so checking costs nothing and logs no error.
    if (request.method === "GET")
      return json(
        200,
        deps.provider ? { available: true } : { available: false, message: UNAVAILABLE_MESSAGE },
      );
    const started = deps.now();
    const failures = deps.failures ?? consoleFailureLogger;
    const report = (level: "warn" | "error", entry: Omit<FailureLog, "durationMs">) =>
      failures(level, { ...entry, durationMs: Math.round(deps.now() - started) });
    const invalid = (status: number, message: string, reason: string) => {
      report("warn", { stage: "validation", code: "invalid", reason });
      return json(status, { code: "invalid", message });
    };

    if (request.method !== "POST") return invalid(405, "Use POST.", `method ${request.method}`);
    if (Number(request.headers.get("content-length") ?? 0) > LIMITS.bodyBytes)
      return invalid(413, "That request is too large.", "body too large");
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > LIMITS.bodyBytes)
      return invalid(413, "That request is too large.", "body too large");

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return invalid(400, "Send JSON.", "body is not JSON");
    }
    const parsed = parse(body, deps.context);
    // parse() returns one of a few fixed messages, never the visitor's text.
    if (typeof parsed === "string") return invalid(400, parsed, parsed);
    const chip = parsed.kind === "chip";

    const provider = deps.provider;
    if (!provider) {
      report("error", { stage: "config", code: "unavailable", chip });
      return json(503, { code: "unavailable", message: UNAVAILABLE_MESSAGE });
    }

    const visitor = await limiterKey(clientIp(request.headers, deps.onVercel), deps.ipSalt);
    const cacheKey = chip
      ? `${deps.context.version}:${provider.model}:${provider.thinking}:${PROMPT_VERSION}:${parsed.chipId}`
      : null;

    // A suggested question answered before: no model call, no cost, no hourly question used.
    const cached = cacheKey ? await deps.cache.get(cacheKey) : null;
    if (cached) {
      const allowed = await deps.cachedPerIp.limit(visitor);
      if (!allowed.success) {
        report("warn", { stage: "limit", code: "rate_limited", reason: "cached answers", chip });
        return rateLimited(toQuota(await deps.perIp.peek(visitor)));
      }
      const quota = toQuota(await deps.perIp.peek(visitor));
      await deps.log.add({
        question: parsed.question,
        at: new Date(deps.now()).toISOString(),
        chip: true,
        declined: false,
        inputTokens: 0,
        outputTokens: 0,
      });
      return sse(async (send) => {
        send({ type: "meta", quota, cachedAnswer: true });
        send({ type: "text", text: cached.text });
        for (const chunkId of cached.citedChunks) send({ type: "citation", chunkId });
        send({
          type: "done",
          trace: trace(provider, deps.context.version, true, cached.citedChunks),
        });
      });
    }

    const hourly = await deps.perIp.limit(visitor);
    if (!hourly.success) {
      report("warn", { stage: "limit", code: "rate_limited", reason: "hourly", chip });
      return rateLimited(toQuota(hourly));
    }
    // From here the question has counted against the visitor's hour. Every way it can fail
    // gives it back, so only answered questions use the allowance.
    const refunded = toQuota({
      ...hourly,
      remaining: Math.min(hourly.limit, hourly.remaining + 1),
    });
    const refund = async () => {
      await deps.perIp.refund(visitor).catch(() => undefined);
      return refunded;
    };

    const latched = await deps.latch.until();
    if (latched !== null) {
      report("warn", { stage: "limit", code: "daily_cap", reason: "provider quota latch", chip });
      return doneForToday(latched, await refund());
    }
    const minute = await deps.perMinute.limit("global");
    if (!minute.success) {
      report("warn", { stage: "limit", code: "busy", reason: "per minute", chip });
      return json(429, {
        code: "busy",
        message: BUSY_MESSAGE,
        resetAt: minute.reset,
        quota: await refund(),
      });
    }
    const daily = await deps.global.limit("global");
    if (!daily.success) {
      report("warn", { stage: "limit", code: "daily_cap", reason: "daily cap", chip });
      return doneForToday(daily.reset, await refund());
    }

    const quota = toQuota(hourly);
    const history = parsed.kind === "question" ? parsed.history : [];
    return sse(async (send) => {
      send({ type: "meta", quota, cachedAnswer: false });
      // One retry for a provider that is overloaded or drops the stream. If words had
      // already reached the visitor, `reset` tells the page to drop them first, so a
      // half answer never sits above the full one or above an error.
      for (let attempt = 1; ; attempt++) {
        let streamed = false;
        try {
          for await (const event of answer(provider, parsed.question, history, {
            context: deps.context,
            signal: request.signal,
          })) {
            if (event.type !== "end") {
              if (event.type === "text") streamed = true;
              send(event);
              continue;
            }
            const tokens = {
              inputTokens: event.usage.inputTokens + event.usage.cacheReadTokens,
              outputTokens: event.usage.outputTokens,
            };
            if (event.jsonError)
              report("warn", {
                stage: "json_parse",
                code: event.stopReason === "max_tokens" ? "cut_off" : "invalid_json",
                reason: `stop reason ${event.stopReason ?? "none"}`,
                attempt,
                model: provider.model,
                chip,
                ...tokens,
              });
            if (event.refused) {
              report("warn", {
                stage: "provider_stream",
                code: "refused",
                reason: "the provider blocked the reply",
                attempt,
                streamed,
                model: provider.model,
                chip,
                ...tokens,
              });
              send({
                type: "error",
                code: "refused",
                message:
                  "I can't answer that one. Try asking about Jasmeet's projects or experience.",
                quota: await refund(),
              });
            }
            send({
              type: "done",
              trace: {
                ...trace(provider, deps.context.version, false, event.citedChunks),
                declined: event.declined,
                inputTokens: event.usage.inputTokens,
                outputTokens: event.usage.outputTokens,
                cacheReadTokens: event.usage.cacheReadTokens,
                cacheWriteTokens: event.usage.cacheWriteTokens,
                thoughtTokens: event.usage.thoughtTokens,
                ttftMs: event.ttftMs,
                totalMs: event.totalMs,
              },
            });
            await deps.log.add({
              question: parsed.question,
              at: new Date(deps.now()).toISOString(),
              chip,
              declined: event.declined,
              inputTokens: event.usage.inputTokens,
              outputTokens: event.usage.outputTokens,
            });
            // Only complete, on-topic chip answers are worth replaying.
            if (cacheKey && event.stopReason === "end_turn" && !event.declined)
              await deps.cache.set(
                cacheKey,
                { text: event.text, citedChunks: event.citedChunks },
                ANSWER_TTL_SECONDS,
              );
          }
          return;
        } catch (error) {
          // The visitor went away: nothing to tell them. The question still counts, since
          // the provider call was made.
          if (request.signal.aborted) return;
          const failure =
            error instanceof ProviderError
              ? error
              : new ProviderError("upstream", "The provider failed.", {
                  errorType: error instanceof Error ? error.name : typeof error,
                });
          // A retry is another provider call, so it has to fit the site's limits too.
          const retrying =
            attempt === 1 &&
            failure.retryable &&
            (await deps.perMinute.limit("global")).success &&
            (await deps.global.limit("global")).success;
          report("error", {
            stage: "provider_stream",
            code: failure.kind,
            errorType: failure.detail.errorType ?? failure.name,
            providerStatus: failure.detail.status ?? null,
            reason: failure.message.slice(0, 120),
            inputTokens: failure.detail.usage?.inputTokens,
            outputTokens: failure.detail.usage?.outputTokens,
            attempt,
            retrying,
            streamed,
            model: provider.model,
            chip,
          });
          if (retrying) {
            if (streamed) send({ type: "reset" });
            continue;
          }
          const back = await refund();
          if (failure.kind === "daily_quota") {
            await deps.latch.set(pacificDay(deps.now()).resetAt).catch(() => undefined);
            send({ type: "error", code: "daily_cap", message: DAILY_MESSAGE, quota: back });
          } else if (failure.kind === "busy" || failure.kind === "overloaded")
            send({ type: "error", code: "busy", message: BUSY_MESSAGE, quota: back });
          else
            send({
              type: "error",
              code: "upstream",
              message: "The assistant couldn't answer just now. Please try again in a moment.",
              quota: back,
            });
          return;
        }
      }
    });
  };
}

function doneForToday(resetAt: number, quota: Quota): Response {
  return json(429, { code: "daily_cap", message: DAILY_MESSAGE, resetAt, quota });
}

function rateLimited(quota: Quota): Response {
  return json(429, {
    code: "rate_limited",
    message: `You've reached this hour's limit of ${quota.limit} questions.`,
    resetAt: quota.resetAt,
    quota: { ...quota, remaining: 0 },
  });
}

function trace(provider: Provider, version: string, cachedAnswer: boolean, cited: string[]): Trace {
  return {
    model: provider.model,
    effort: provider.effort,
    thinking: provider.thinking,
    contextVersion: version,
    citedChunks: cited,
    cachedAnswer,
    declined: false,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    ttftMs: null,
    totalMs: 0,
  };
}

/** A text/event-stream response fed by `run`. */
function sse(run: (send: (event: StreamEvent) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        await run(send);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
