/**
 * Structured server logs for assistant failures, one JSON line each. Vercel files
 * console.error under "error" and console.warn under "warning", so its level filter
 * finds them. A failure log never holds the question, an IP or IP hash, or a key: only
 * where it failed, what kind of error, the provider's status, timing and token counts.
 */
export type FailureStage =
  /** The request was malformed: wrong method, too large, bad JSON, bad question. */
  | "validation"
  /** A site limit turned it away: hourly, per minute, daily, or the provider's daily quota latch. */
  | "limit"
  /** The assistant isn't configured (no key, Upstash, salt or limits on Vercel). */
  | "config"
  /** The provider failed or refused while answering. */
  | "provider_stream"
  /** The provider's JSON reply didn't parse; the words that arrived were kept. */
  | "json_parse";

export interface FailureLog {
  stage: FailureStage;
  /** What happened, e.g. rate_limited, overloaded, upstream, cut_off. */
  code: string;
  /** The underlying error's name (ApiError, AbortError, ProviderError...). */
  errorType?: string;
  /** The provider's HTTP status, when there was one. */
  providerStatus?: number | null;
  /** A short, fixed description: never visitor text. */
  reason?: string;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  /** 1 for the first provider call, 2 for the retry. */
  attempt?: number;
  /** Whether the server asks the provider again after this failure. */
  retrying?: boolean;
  /** Whether answer text had already reached the visitor. */
  streamed?: boolean;
  model?: string;
  chip?: boolean;
}

export type FailureLogger = (level: "warn" | "error", entry: FailureLog) => void;

export const consoleFailureLogger: FailureLogger = (level, entry) => {
  const line = JSON.stringify({ event: "assistant_failure", level, ...entry });
  if (level === "error") console.error(line);
  else console.warn(line);
};
