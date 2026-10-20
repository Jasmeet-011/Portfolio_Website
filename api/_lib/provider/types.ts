import type { ChatTurn } from "../protocol.js";

/**
 * The one seam between the assistant and an LLM provider. Anything that can stream an
 * answer with citations to numbered sections fits: Gemini and the Claude API today,
 * LLM Gateway later (add a spec in ./index.ts).
 */
export interface ProviderRequest {
  system: string;
  documentTitle: string;
  /** The grounding, in order. Citations refer to these by index. */
  sections: string[];
  /** Each section's chunk id, in the same order, for providers the model names sources to. */
  sectionIds: string[];
  /** Earlier exchanges, oldest first, starting with a user turn. */
  history: ChatTurn[];
  question: string;
  maxTokens: number;
}

export interface ProviderUsage {
  inputTokens: number;
  /** Includes thinking tokens. */
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** Thinking tokens, where the provider reports them separately. */
  thoughtTokens?: number;
}

export type ProviderEvent =
  | { type: "text"; text: string }
  /** The answer so far cites `sections[index]`. */
  | { type: "citation"; index: number }
  | {
      type: "end";
      stopReason: string | null;
      usage: ProviderUsage;
      /** Sources the model named that aren't real chunk ids: dropped, never cited. */
      unknownSources?: string[];
    };

export interface Provider {
  model: string;
  /** Claude's effort setting; null where the provider has none. */
  effort: string | null;
  /** "adaptive" or "off" for Claude, a thinking level for Gemini. */
  thinking: string;
  stream(request: ProviderRequest, signal?: AbortSignal): AsyncIterable<ProviderEvent>;
}

export interface ProviderConfig {
  apiKey: string;
  model: string;
  /** One of the provider's thinking modes (ProviderSpec.thinkingModes). */
  thinking: string;
}

/**
 * A provider failure the handler tells visitors about in plain words: the provider's
 * daily quota is used up, or it's briefly rate limiting (per minute).
 */
export class ProviderError extends Error {
  constructor(
    readonly kind: "daily_quota" | "busy",
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
