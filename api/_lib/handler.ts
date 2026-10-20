import { answer, type Context } from "./answer.js";
import { clientIp, limiterKey } from "./ip.js";
import type { Limiter } from "./limits.js";
import { PROMPT_VERSION } from "./prompt.js";
import {
  LIMITS,
  type AssistantRequest,
  type ChatTurn,
  type ErrorBody,
  type Quota,
  type StreamEvent,
  type Trace,
} from "./protocol.js";
import type { Provider } from "./provider/index.js";
import { ANSWER_TTL_SECONDS, type AnswerCache, type QuestionLog } from "./store.js";

export interface Deps {
  /** Null when the assistant isn't configured (no API key): every request gets 503. */
  provider: Provider | null;
  perIp: Limiter;
  /** Repeat clicks on cached suggested questions. */
  cachedPerIp: Limiter;
  global: Limiter;
  cache: AnswerCache;
  log: QuestionLog;
  context: Context;
  onVercel: boolean;
  ipSalt: string;
  now: () => number;
}

const json = (status: number, body: ErrorBody) =>
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
    if (request.method !== "POST") return json(405, { code: "invalid", message: "Use POST." });
    if (Number(request.headers.get("content-length") ?? 0) > LIMITS.bodyBytes)
      return json(413, { code: "invalid", message: "That request is too large." });
    const raw = await request.text();
    if (raw.length > LIMITS.bodyBytes)
      return json(413, { code: "invalid", message: "That request is too large." });

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json(400, { code: "invalid", message: "Send JSON." });
    }
    const parsed = parse(body, deps.context);
    if (typeof parsed === "string") return json(400, { code: "invalid", message: parsed });

    const provider = deps.provider;
    if (!provider)
      return json(503, {
        code: "unavailable",
        message: "The assistant isn't available right now. Everything it knows is in these files.",
      });

    const visitor = await limiterKey(clientIp(request.headers, deps.onVercel), deps.ipSalt);
    const cacheKey =
      parsed.kind === "chip"
        ? `${deps.context.version}:${provider.model}:${provider.thinking}:${PROMPT_VERSION}:${parsed.chipId}`
        : null;

    // A suggested question answered before: no model call, no cost, no hourly question used.
    const cached = cacheKey ? await deps.cache.get(cacheKey) : null;
    if (cached) {
      const allowed = await deps.cachedPerIp.limit(visitor);
      if (!allowed.success) return rateLimited(toQuota(await deps.perIp.peek(visitor)));
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
    if (!hourly.success) return rateLimited(toQuota(hourly));
    const daily = await deps.global.limit("global");
    if (!daily.success)
      return json(429, {
        code: "daily_cap",
        message: "The assistant is done for today. Everything it knows is in these files.",
        resetAt: daily.reset,
        quota: toQuota(hourly),
      });

    const quota = toQuota(hourly);
    const history = parsed.kind === "question" ? parsed.history : [];
    return sse(async (send) => {
      send({ type: "meta", quota, cachedAnswer: false });
      try {
        for await (const event of answer(provider, parsed.question, history, {
          context: deps.context,
          signal: request.signal,
        })) {
          if (event.type !== "end") {
            send(event);
            continue;
          }
          if (event.refused)
            send({
              type: "error",
              code: "refused",
              message:
                "I can't answer that one. Try asking about Jasmeet's projects or experience.",
            });
          send({
            type: "done",
            trace: {
              ...trace(provider, deps.context.version, false, event.citedChunks),
              declined: event.declined,
              inputTokens: event.usage.inputTokens,
              outputTokens: event.usage.outputTokens,
              cacheReadTokens: event.usage.cacheReadTokens,
              cacheWriteTokens: event.usage.cacheWriteTokens,
              ttftMs: event.ttftMs,
              totalMs: event.totalMs,
            },
          });
          await deps.log.add({
            question: parsed.question,
            at: new Date(deps.now()).toISOString(),
            chip: parsed.kind === "chip",
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
      } catch {
        send({
          type: "error",
          code: "upstream",
          message: "The assistant couldn't answer just now. Please try again in a moment.",
        });
      }
    });
  };
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
