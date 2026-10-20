/**
 * What the browser and api/copilot.ts send each other. Type-only on the client side.
 *
 * Request: POST /api/copilot with JSON, either a typed question (with up to three
 * earlier exchanges) or the id of a suggested-question chip.
 * Response: a JSON error with a 4xx/5xx status before anything is generated, or a
 * text/event-stream of StreamEvents ("data: <json>" lines).
 */
export const LIMITS = {
  questionChars: 500,
  /** Earlier messages sent back as context: three exchanges. */
  historyMessages: 6,
  historyMessageChars: 2000,
  bodyBytes: 8192,
  maxOutputTokens: 1024,
  /** Default hourly questions per visitor; the server can be configured otherwise. */
  hourlyQuestions: 10,
} as const;

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface AssistantRequest {
  question?: string;
  chipId?: string;
  history?: ChatTurn[];
}

/** The visitor's hourly allowance. `resetAt` is epoch milliseconds. */
export interface Quota {
  limit: number;
  remaining: number;
  resetAt: number;
}

export type ErrorCode =
  "invalid" | "rate_limited" | "daily_cap" | "unavailable" | "refused" | "upstream";

export interface ErrorBody {
  code: ErrorCode;
  message: string;
  quota?: Quota;
  /** When the limit that was hit resets (epoch ms). */
  resetAt?: number;
}

/** Shown in Output > Assistant trace. Nothing secret, nothing about other visitors. */
export interface Trace {
  model: string;
  effort: string;
  thinking: "adaptive" | "off";
  contextVersion: string;
  citedChunks: string[];
  /** Served from the suggested-question cache: no model call, no cost. */
  cachedAnswer: boolean;
  declined: boolean;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** Time to the first words of the answer. */
  ttftMs: number | null;
  totalMs: number;
}

export type StreamEvent =
  | { type: "meta"; quota: Quota | null; cachedAnswer: boolean }
  | { type: "text"; text: string }
  | { type: "citation"; chunkId: string }
  | { type: "done"; trace: Trace }
  | { type: "error"; code: ErrorCode; message: string };
