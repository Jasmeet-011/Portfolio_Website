import { CONTEXT } from "../_generated/context.js";
import { DOCUMENT_TITLE, isDecline, SYSTEM_PROMPT } from "./prompt.js";
import { LIMITS, type ChatTurn } from "./protocol.js";
import type { Provider } from "./provider/index.js";

export type Context = typeof CONTEXT;

export type AnswerEvent =
  | { type: "text"; text: string }
  | { type: "citation"; chunkId: string }
  | {
      type: "end";
      text: string;
      citedChunks: string[];
      /** Sources the model named that aren't chunk ids, dropped before any chip. */
      unknownCitations: string[];
      declined: boolean;
      refused: boolean;
      stopReason: string | null;
      usage: {
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;
        cacheWriteTokens: number;
        thoughtTokens?: number;
      };
      ttftMs: number | null;
      totalMs: number;
    };

/**
 * One answer, grounded in the context: the request the provider sees, citations mapped
 * from section indexes back to chunk ids (an index with no chunk is dropped, so every
 * chip opens a real section), and the timings. Shared by the API handler
 * and the eval runner, so evals test exactly what visitors get.
 */
export async function* answer(
  provider: Provider,
  question: string,
  history: ChatTurn[] = [],
  options: { context?: Context; signal?: AbortSignal; now?: () => number } = {},
): AsyncGenerator<AnswerEvent> {
  const context = options.context ?? CONTEXT;
  const now = options.now ?? (() => performance.now());
  const started = now();
  let ttftMs: number | null = null;
  let text = "";
  const cited: string[] = [];

  const events = provider.stream(
    {
      system: SYSTEM_PROMPT,
      documentTitle: DOCUMENT_TITLE,
      sections: context.chunks.map((c) => `[${c.label}]\n${c.text}`),
      sectionIds: context.chunks.map((c) => c.id),
      history,
      question,
      maxTokens: LIMITS.maxOutputTokens,
    },
    options.signal,
  );

  for await (const event of events) {
    if (event.type === "text") {
      if (ttftMs === null && event.text.trim()) ttftMs = Math.round(now() - started);
      text += event.text;
      yield event;
    } else if (event.type === "citation") {
      const id = context.chunks[event.index]?.id;
      if (id && !cited.includes(id)) {
        cited.push(id);
        yield { type: "citation", chunkId: id };
      }
    } else {
      const refused = event.stopReason === "refusal";
      yield {
        type: "end",
        text,
        citedChunks: cited,
        unknownCitations: event.unknownSources ?? [],
        declined: refused || isDecline(text),
        refused,
        stopReason: event.stopReason,
        usage: event.usage,
        ttftMs,
        totalMs: Math.round(now() - started),
      };
    }
  }
}
