import { Redis } from "@upstash/redis";
import { CONTEXT } from "../_generated/context.js";
import type { Deps } from "./handler.js";
import {
  freeTierLimits,
  LIMIT_DEFAULTS,
  memoryCounter,
  memoryLimiter,
  pacificDayLimiter,
  redisCounter,
  upstashLimiter,
} from "./limits.js";
import { providerSpec, type ProviderSpec } from "./provider/index.js";
import {
  memoryAnswerCache,
  memoryQuestionLog,
  memoryQuotaLatch,
  upstashAnswerCache,
  upstashQuestionLog,
  upstashQuotaLatch,
} from "./store.js";

type Env = Record<string, string | undefined>;

const int = (value: string | undefined): number | null => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** Claude is paid per token, so its caps are about cost, not a quota. */
const PAID_LIMITS = { dailyCap: 300, perMinute: 60 };
/** Local dev only, while a free tier's numbers are unknown. Vercel never uses these. */
const LOCAL_LIMITS = { dailyCap: 50, perMinute: 5 };

/**
 * The daily cap and per-minute limit: an env override, else 80% of the free tier
 * (limits.ts, freeTierLimits), else null when neither is known.
 */
export function siteLimits(spec: ProviderSpec & { name: string }, env: Env) {
  const base =
    spec.name === "anthropic" ? PAID_LIMITS : spec.freeTier ? freeTierLimits(spec.freeTier) : null;
  const dailyCap = int(env.ASSISTANT_DAILY_CAP) ?? base?.dailyCap ?? null;
  const perMinute = int(env.ASSISTANT_PER_MINUTE) ?? base?.perMinute ?? null;
  return dailyCap !== null && perMinute !== null ? { dailyCap, perMinute } : null;
}

/**
 * Production wiring from environment variables (see .env.example). ASSISTANT_PROVIDER
 * picks the provider (default gemini). On Vercel the assistant fails closed: without the
 * key, Upstash, the IP salt and known limits it answers 503 rather than run unbounded.
 * Off Vercel (npm run dev) limits and logs live in memory.
 */
export function depsFromEnv(env: Env = process.env): Deps {
  const onVercel = env.VERCEL === "1";
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  const redis = url && token ? new Redis({ url, token }) : null;
  const salt = env.IP_HASH_SALT;
  const spec = providerSpec(env.ASSISTANT_PROVIDER);
  const apiKey = spec ? env[spec.keyEnv] : undefined;
  const known = spec ? siteLimits(spec, env) : null;
  const limits = known ?? LOCAL_LIMITS;
  const ready =
    spec !== null &&
    Boolean(apiKey) &&
    (!onVercel || (redis !== null && Boolean(salt) && known !== null));

  const perIpHourly = int(env.ASSISTANT_PER_IP_HOURLY) ?? LIMIT_DEFAULTS.perIpHourly;
  const thinking =
    spec && env.ASSISTANT_THINKING && spec.thinkingModes.includes(env.ASSISTANT_THINKING)
      ? env.ASSISTANT_THINKING
      : spec?.defaultThinking;

  return {
    provider:
      ready && spec
        ? spec.create({
            apiKey: apiKey ?? "",
            model: env.ASSISTANT_MODEL || spec.defaultModel,
            thinking: thinking ?? spec.defaultThinking,
          })
        : null,
    perIp: redis
      ? upstashLimiter(redis, "ip", perIpHourly, "1 h")
      : memoryLimiter(perIpHourly, "1 h"),
    cachedPerIp: redis
      ? upstashLimiter(redis, "cached", LIMIT_DEFAULTS.cachedPerIpHourly, "1 h")
      : memoryLimiter(LIMIT_DEFAULTS.cachedPerIpHourly, "1 h"),
    perMinute: redis
      ? upstashLimiter(redis, "minute", limits.perMinute, "1 m")
      : memoryLimiter(limits.perMinute, "1 m"),
    global: pacificDayLimiter(redis ? redisCounter(redis) : memoryCounter(), limits.dailyCap),
    latch: redis ? upstashQuotaLatch(redis) : memoryQuotaLatch(),
    cache: redis ? upstashAnswerCache(redis) : memoryAnswerCache(),
    log: redis ? upstashQuestionLog(redis) : memoryQuestionLog(),
    context: CONTEXT,
    onVercel,
    ipSalt: salt ?? "local-dev",
    now: () => Date.now(),
  };
}
