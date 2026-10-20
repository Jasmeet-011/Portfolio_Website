import { Redis } from "@upstash/redis";
import { CONTEXT } from "../_generated/context.js";
import type { Deps } from "./handler.js";
import { LIMIT_DEFAULTS, memoryLimiter, upstashLimiter } from "./limits.js";
import { createProvider } from "./provider/index.js";
import {
  memoryAnswerCache,
  memoryQuestionLog,
  upstashAnswerCache,
  upstashQuestionLog,
} from "./store.js";

/** Claude Haiku 5.5, checked against Anthropic's models overview on 2026-10-20. */
export const DEFAULT_MODEL = "claude-haiku-5-5";
/** Set from the eval run's time-to-first-words comparison (evals/report.md). */
export const DEFAULT_THINKING: "adaptive" | "off" = "off";

type Env = Record<string, string | undefined>;

const int = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

/**
 * Production wiring from environment variables (see .env.example). On Vercel the
 * assistant fails closed: without Upstash and the IP salt it answers 503 rather than
 * run with no limits. Off Vercel (npm run dev) limits and logs live in memory.
 */
export function depsFromEnv(env: Env = process.env): Deps {
  const onVercel = env.VERCEL === "1";
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  const redis = url && token ? new Redis({ url, token }) : null;
  const salt = env.IP_HASH_SALT;
  const ready = Boolean(env.ANTHROPIC_API_KEY) && (!onVercel || (redis !== null && Boolean(salt)));

  const perIpHourly = int(env.ASSISTANT_PER_IP_HOURLY, LIMIT_DEFAULTS.perIpHourly);
  const dailyCap = int(env.ASSISTANT_DAILY_CAP, LIMIT_DEFAULTS.dailyCap);
  const thinking =
    env.ASSISTANT_THINKING === "adaptive" || env.ASSISTANT_THINKING === "off"
      ? env.ASSISTANT_THINKING
      : DEFAULT_THINKING;

  return {
    provider: ready
      ? createProvider({
          apiKey: env.ANTHROPIC_API_KEY ?? "",
          model: env.ASSISTANT_MODEL || DEFAULT_MODEL,
          effort: "low",
          thinking,
        })
      : null,
    perIp: redis
      ? upstashLimiter(redis, "ip", perIpHourly, "1 h", "sliding")
      : memoryLimiter(perIpHourly, "1 h"),
    cachedPerIp: redis
      ? upstashLimiter(redis, "cached", LIMIT_DEFAULTS.cachedPerIpHourly, "1 h", "sliding")
      : memoryLimiter(LIMIT_DEFAULTS.cachedPerIpHourly, "1 h"),
    global: redis
      ? upstashLimiter(redis, "global", dailyCap, "1 d", "fixed")
      : memoryLimiter(dailyCap, "1 d"),
    cache: redis ? upstashAnswerCache(redis) : memoryAnswerCache(),
    log: redis ? upstashQuestionLog(redis) : memoryQuestionLog(),
    context: CONTEXT,
    onVercel,
    ipSalt: salt ?? "local-dev",
    now: () => Date.now(),
  };
}
