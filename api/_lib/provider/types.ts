import type { ChatTurn } from "../protocol.js";

/**
 * The one seam between the assistant and an LLM provider. Anything that can stream an
 * answer with citations to numbered sections fits: the Claude API today, LLM Gateway
 * later (swap the factory in ./index.ts).
 */
export interface ProviderRequest {
  system: string;
  documentTitle: string;
  /** The grounding, in order. Citations refer to these by index. */
  sections: string[];
  /** Earlier exchanges, oldest first, starting with a user turn. */
  history: ChatTurn[];
  question: string;
  maxTokens: number;
}

export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export type ProviderEvent =
  | { type: "text"; text: string }
  /** The answer so far cites `sections[index]`. */
  | { type: "citation"; index: number }
  | { type: "end"; stopReason: string | null; usage: ProviderUsage };

export interface Provider {
  model: string;
  effort: string;
  thinking: "adaptive" | "off";
  stream(request: ProviderRequest, signal?: AbortSignal): AsyncIterable<ProviderEvent>;
}

export interface ProviderConfig {
  apiKey: string;
  model: string;
  effort: "low" | "medium" | "high";
  thinking: "adaptive" | "off";
}
