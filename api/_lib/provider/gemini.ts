import {
  ApiError,
  GoogleGenAI,
  ThinkingLevel,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from "@google/genai";
import { JSON_REPLY } from "../prompt.js";
import { jsonAnswerReader } from "./json-answer.js";
import {
  ProviderError,
  type ProviderFailureDetail,
  type Provider,
  type ProviderConfig,
  type ProviderEvent,
  type ProviderRequest,
} from "./types.js";

/** Gemini 3.5 Flash-Lite can't turn thinking off; minimal is its default and its floor. */
export const GEMINI_THINKING = {
  minimal: ThinkingLevel.MINIMAL,
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
} as const;

type GeminiThinking = keyof typeof GEMINI_THINKING;

/** The one SDK call this provider makes, so tests can stand in for the API. */
export type GeminiModels = Pick<GoogleGenAI["models"], "generateContentStream">;

/** Finish reasons where Gemini blocked the reply rather than finishing it. */
const BLOCKED = new Set(["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "RECITATION"]);
const STOP_REASONS: Record<string, string> = { STOP: "end_turn", MAX_TOKENS: "max_tokens" };

/**
 * The request Gemini sees. The grounding sits in the system instruction after the rules,
 * one <section> per chunk with its id. The reply is JSON whose `sources` must come from
 * the enum of those ids, and the server checks them again in `geminiProvider`.
 */
export function geminiRequest(
  config: ProviderConfig,
  request: ProviderRequest,
  signal?: AbortSignal,
): GenerateContentParameters {
  const document = [
    `<document title="${request.documentTitle}">`,
    ...request.sections.map(
      (text, i) => `<section id="${request.sectionIds[i] ?? i}">\n${text}\n</section>`,
    ),
    "</document>",
  ].join("\n");
  const turns = [...request.history, { role: "user" as const, text: request.question }];
  return {
    model: config.model,
    contents: turns.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.text }],
    })),
    config: {
      systemInstruction: `${request.system}\n\n${JSON_REPLY}\n\n${document}`,
      maxOutputTokens: request.maxTokens,
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          sources: { type: "array", items: { type: "string", enum: request.sectionIds } },
        },
        required: ["answer", "sources"],
        additionalProperties: false,
      },
      thinkingConfig: {
        thinkingLevel: GEMINI_THINKING[config.thinking as GeminiThinking] ?? ThinkingLevel.MINIMAL,
      },
      abortSignal: signal,
    },
  };
}

/**
 * Every Gemini failure as a ProviderError, with what the server logs about it. A 429 is
 * the free tier's per-day quota (the error names a PerDay quota id) or a per-minute
 * limit; anything unrecognized counts as per minute, since it clears on its own and the
 * site's own daily cap still holds. A 503 is Google's "model is experiencing high demand".
 * Anything else (a stream Google closes early, the SDK's 30 s timeout, a network error, a
 * 500) is upstream. Both of those are worth one retry.
 */
export function classifyGeminiError(
  error: unknown,
  detail: Omit<ProviderFailureDetail, "status" | "errorType"> = {},
): ProviderError {
  if (error instanceof ProviderError) return error;
  const status = error instanceof ApiError ? error.status : null;
  const full = {
    ...detail,
    status,
    errorType: error instanceof Error ? error.name : typeof error,
  };
  if (status === 503)
    return new ProviderError("overloaded", "Gemini is overloaded right now.", full);
  if (status === 429)
    return /PerDay/i.test(error instanceof Error ? error.message : "")
      ? new ProviderError("daily_quota", "Gemini's daily quota is used up.", full)
      : new ProviderError("busy", "Gemini is rate limiting this minute.", full);
  const message = error instanceof Error ? error.message.slice(0, 120) : String(error);
  return new ProviderError("upstream", `Gemini failed: ${message}`, full);
}

const textOf = (chunk: GenerateContentResponse) =>
  (chunk.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text)
    .join("");

/** The Gemini API through the official SDK, answering in JSON with its sources. */
export function geminiProvider(config: ProviderConfig, models?: GeminiModels): Provider {
  const api =
    models ??
    new GoogleGenAI({
      apiKey: config.apiKey,
      // No retries: a retried 429 only spends more of the quota.
      httpOptions: { timeout: 30_000, retryOptions: { attempts: 1 } },
    }).models;

  return {
    model: config.model,
    effort: null,
    thinking: config.thinking,
    async *stream(request, signal): AsyncIterable<ProviderEvent> {
      const reader = jsonAnswerReader();
      let usage: GenerateContentResponse["usageMetadata"];
      let finish: string | undefined;
      let blocked = false;
      let streamed = false;
      try {
        const stream = await api.generateContentStream(geminiRequest(config, request, signal));
        for await (const chunk of stream) {
          if (chunk.promptFeedback?.blockReason) blocked = true;
          const reason = chunk.candidates?.[0]?.finishReason;
          if (reason) finish = String(reason);
          if (chunk.usageMetadata) usage = chunk.usageMetadata;
          const text = textOf(chunk);
          const delta = text ? reader.push(text) : "";
          if (delta) {
            streamed = true;
            yield { type: "text", text: delta };
          }
        }
      } catch (error) {
        // The visitor went away: not a provider failure, nothing to retry or report.
        if (signal?.aborted) throw error;
        throw classifyGeminiError(error, {
          streamed,
          usage: usage
            ? {
                inputTokens: usage.promptTokenCount ?? 0,
                outputTokens: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
              }
            : undefined,
        });
      }

      const { rest, sources, parsed } = reader.finish();
      if (rest) yield { type: "text", text: rest };
      const unknownSources: string[] = [];
      for (const id of new Set(sources)) {
        const index = request.sectionIds.indexOf(id);
        if (index >= 0) yield { type: "citation", index };
        else unknownSources.push(id);
      }

      const cached = usage?.cachedContentTokenCount ?? 0;
      const thoughts = usage?.thoughtsTokenCount ?? 0;
      yield {
        type: "end",
        stopReason:
          blocked || (finish && BLOCKED.has(finish))
            ? "refusal"
            : finish
              ? (STOP_REASONS[finish] ?? finish.toLowerCase())
              : null,
        usage: {
          inputTokens: Math.max(0, (usage?.promptTokenCount ?? 0) - cached),
          outputTokens: (usage?.candidatesTokenCount ?? 0) + thoughts,
          cacheReadTokens: cached,
          cacheWriteTokens: 0,
          thoughtTokens: thoughts,
        },
        unknownSources,
        jsonError: !parsed,
      };
    },
  };
}
