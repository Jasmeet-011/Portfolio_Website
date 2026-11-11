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
      /** The reply wasn't valid JSON (providers that answer in JSON): logged, not shown. */
      jsonError?: boolean;
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
 * daily_quota: the provider's daily quota is used up. busy: it's rate limiting this
 * minute. overloaded: it's short of capacity (Gemini's 503 "high demand"). upstream:
 * anything else that went wrong talking to it, such as a stream closed early or a
 * timeout. Overloaded and upstream failures are worth one retry; the others aren't.
 */
export type ProviderErrorKind = "daily_quota" | "busy" | "overloaded" | "upstream";

/** What the server logs about a provider failure. Never the question, a key or an IP. */
export interface ProviderFailureDetail {
  /** The provider's HTTP status, when it answered with one. */
  status?: number | null;
  /** The underlying error's name, e.g. ApiError, AbortError, Error. */
  errorType?: string;
  /** Tokens the provider reported before it failed, if it got that far. */
  usage?: Partial<ProviderUsage>;
  /** Whether any answer text had streamed before the failure. */
  streamed?: boolean;
}

/** A provider failure the handler tells visitors about in plain words. */
export class ProviderError extends Error {
  constructor(
    readonly kind: ProviderErrorKind,
    message: string,
    readonly detail: ProviderFailureDetail = {},
  ) {
    super(message);
    this.name = "ProviderError";
  }

  get retryable(): boolean {
    return this.kind === "overloaded" || this.kind === "upstream";
  }
}
