import type { Redis } from "@upstash/redis";

/** A suggested-question answer, replayed for free on repeat clicks. */
export interface CachedAnswer {
  text: string;
  citedChunks: string[];
}

export interface AnswerCache {
  get(key: string): Promise<CachedAnswer | null>;
  set(key: string, value: CachedAnswer, ttlSeconds: number): Promise<void>;
}

/**
 * One asked question, kept anonymously to grow the eval set from real questions
 * (Decisions log, 2026-10-20). No IP, no IP hash, no session or visitor id, and nothing
 * about the answer beyond token counts.
 */
export interface LoggedQuestion {
  question: string;
  /** ISO timestamp. */
  at: string;
  chip: boolean;
  declined: boolean;
  inputTokens: number;
  outputTokens: number;
}

export interface QuestionLog {
  add(entry: LoggedQuestion): Promise<void>;
}

export const ANSWER_TTL_SECONDS = 7 * 24 * 60 * 60;
export const QUESTION_TTL_SECONDS = 30 * 24 * 60 * 60;
/** scripts/assistant-questions.mjs scans for this prefix. */
export const QUESTION_KEY_PREFIX = "assistant:q:";

export function upstashAnswerCache(redis: Redis): AnswerCache {
  return {
    get: (key) => redis.get<CachedAnswer>(`assistant:answer:${key}`),
    async set(key, value, ttlSeconds) {
      await redis.set(`assistant:answer:${key}`, value, { ex: ttlSeconds });
    },
  };
}

/** Each question is its own key with a 30-day expiry, so old ones disappear on their own. */
export function upstashQuestionLog(redis: Redis): QuestionLog {
  return {
    async add(entry) {
      const key = `${QUESTION_KEY_PREFIX}${entry.at}:${crypto.randomUUID().slice(0, 8)}`;
      await redis.set(key, entry, { ex: QUESTION_TTL_SECONDS });
    },
  };
}

export function memoryAnswerCache(): AnswerCache & { entries: Map<string, CachedAnswer> } {
  const entries = new Map<string, CachedAnswer>();
  return {
    entries,
    get: async (key) => entries.get(key) ?? null,
    set: async (key, value) => {
      entries.set(key, value);
    },
  };
}

export function memoryQuestionLog(): QuestionLog & { entries: LoggedQuestion[] } {
  const entries: LoggedQuestion[] = [];
  return {
    entries,
    add: async (entry) => {
      entries.push(entry);
    },
  };
}

/**
 * Set when the provider says its daily quota is used up: until `until` (midnight
 * Pacific, when Google resets it) the site answers "done for today" without calling it.
 */
export interface QuotaLatch {
  /** Epoch ms the latch holds until, or null when it isn't set. */
  until(): Promise<number | null>;
  set(until: number): Promise<void>;
}

const LATCH_KEY = "assistant:quota-exhausted";

export function upstashQuotaLatch(redis: Redis, now = () => Date.now()): QuotaLatch {
  return {
    async until() {
      const value = await redis.get<number>(LATCH_KEY);
      return value && value > now() ? value : null;
    },
    async set(until) {
      const ms = until - now();
      if (ms > 0) await redis.set(LATCH_KEY, until, { px: ms });
    },
  };
}

export function memoryQuotaLatch(now = () => Date.now()): QuotaLatch {
  let latched: number | null = null;
  return {
    until: async () => (latched !== null && latched > now() ? latched : null),
    set: async (until) => {
      latched = until;
    },
  };
}
