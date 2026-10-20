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
  /** Repeat clicks on a cached suggested question: free, but not unlimited. */
  cachedPerIpHourly: 60,
} as const;

/**
 * The site's own share of a free tier: about 80% of the per-day and per-minute limits,
 * so the site stops before Google does. Evals use a separate project's key, so no room
 * is kept for them.
 */
export function freeTierLimits(tier: { rpm: number; rpd: number }) {
  return {
    dailyCap: Math.max(1, Math.floor(tier.rpd * 0.8)),
    perMinute: Math.max(1, Math.floor(tier.rpm * 0.8)),
  };
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

type Window = "1 m" | "1 h";

/** Upstash sliding windows: per visitor per hour, and for everyone per minute. */
export function upstashLimiter(
  redis: Redis,
  prefix: string,
  limit: number,
  window: Window,
): Limiter {
  const ratelimit = new Ratelimit({
    redis,
    prefix: `assistant:rl:${prefix}`,
    limiter: Ratelimit.slidingWindow(limit, window),
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
export function memoryLimiter(limit: number, window: Window, now = () => Date.now()): Limiter {
  const size = window === "1 m" ? MINUTE : HOUR;
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

const PACIFIC = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Pacific wall-clock fields at `t`. */
function pacificParts(t: number) {
  const parts = Object.fromEntries(
    PACIFIC.formatToParts(t).map((p) => [p.type, Number(p.value)]),
  ) as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>;
  return parts;
}

/** Pacific time minus UTC at `t`, in milliseconds (-7 h in summer, -8 h in winter). */
function pacificOffset(t: number): number {
  const p = pacificParts(t);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(t / 1000) * 1000;
}

/**
 * The Pacific calendar day at `now`, and when it ends. Google's free-tier daily quota
 * resets at midnight Pacific, so the site's daily cap does too.
 */
export function pacificDay(now: number): { key: string; resetAt: number } {
  const p = pacificParts(now);
  const key = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  const nextMidnightWall = Date.UTC(p.year, p.month - 1, p.day + 1);
  // DST changes at 2am, so the offset an hour before midnight is the offset at midnight.
  const resetAt = nextMidnightWall - pacificOffset(nextMidnightWall - pacificOffset(now) - HOUR);
  return { key, resetAt };
}

/** Counts per key with an expiry: Redis INCR in production, a Map locally. */
export interface Counter {
  incr(key: string, ttlSeconds: number): Promise<number>;
  get(key: string): Promise<number>;
}

export function redisCounter(redis: Redis): Counter {
  return {
    async incr(key, ttlSeconds) {
      const [count] = await redis
        .pipeline()
        .incr(key)
        .expire(key, ttlSeconds)
        .exec<[number, number]>();
      return count;
    },
    get: async (key) => Number((await redis.get<number>(key)) ?? 0),
  };
}

export function memoryCounter(): Counter {
  const counts = new Map<string, number>();
  return {
    async incr(key) {
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      return count;
    },
    get: async (key) => counts.get(key) ?? 0,
  };
}

/** `limit` hits per Pacific calendar day, for everyone. */
export function pacificDayLimiter(
  counter: Counter,
  limit: number,
  now = () => Date.now(),
): Limiter {
  const keyOf = (id: string) => {
    const day = pacificDay(now());
    return { key: `assistant:day:${id}:${day.key}`, reset: day.resetAt };
  };
  return {
    async limit(id) {
      const { key, reset } = keyOf(id);
      const used = await counter.incr(key, 2 * 24 * 60 * 60);
      return { success: used <= limit, limit, remaining: Math.max(0, limit - used), reset };
    },
    async peek(id) {
      const { key, reset } = keyOf(id);
      return { limit, remaining: Math.max(0, limit - (await counter.get(key))), reset };
    },
  };
}
