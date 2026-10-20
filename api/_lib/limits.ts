import { Ratelimit } from "@upstash/ratelimit";
import type { Redis } from "@upstash/redis";
import { LIMITS } from "./protocol.js";

/** A counter that allows `limit` hits per window. `reset` is epoch milliseconds. */
export interface Limiter {
  /** Counts one hit and says whether it was allowed. */
  limit(id: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }>;
  /** What is left, without counting a hit. */
  peek(id: string): Promise<{ limit: number; remaining: number; reset: number }>;
}

export const LIMIT_DEFAULTS = {
  perIpHourly: LIMITS.hourlyQuestions,
  dailyCap: 300,
  /** Repeat clicks on a cached suggested question: free, but not unlimited. */
  cachedPerIpHourly: 60,
} as const;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Upstash: sliding window per visitor, fixed UTC-day window for the global cap. */
export function upstashLimiter(
  redis: Redis,
  prefix: string,
  limit: number,
  window: "1 h" | "1 d",
  kind: "sliding" | "fixed",
): Limiter {
  const ratelimit = new Ratelimit({
    redis,
    prefix: `assistant:rl:${prefix}`,
    limiter:
      kind === "sliding"
        ? Ratelimit.slidingWindow(limit, window)
        : Ratelimit.fixedWindow(limit, window),
  });
  return {
    async limit(id) {
      const r = await ratelimit.limit(id);
      return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
    },
    async peek(id) {
      const r = await ratelimit.getRemaining(id);
      return { limit, remaining: r.remaining, reset: r.reset };
    },
  };
}

/** In memory, for local dev and tests. Fixed windows aligned to the window size. */
export function memoryLimiter(
  limit: number,
  window: "1 h" | "1 d",
  now = () => Date.now(),
): Limiter {
  const size = window === "1 h" ? HOUR : DAY;
  const counts = new Map<string, { start: number; count: number }>();
  const current = (id: string) => {
    const start = Math.floor(now() / size) * size;
    const entry = counts.get(id);
    if (!entry || entry.start !== start) return { start, count: 0 };
    return entry;
  };
  return {
    async limit(id) {
      const entry = current(id);
      const success = entry.count < limit;
      if (success) counts.set(id, { start: entry.start, count: entry.count + 1 });
      const used = success ? entry.count + 1 : entry.count;
      return { success, limit, remaining: Math.max(0, limit - used), reset: entry.start + size };
    },
    async peek(id) {
      const entry = current(id);
      return { limit, remaining: Math.max(0, limit - entry.count), reset: entry.start + size };
    },
  };
}
