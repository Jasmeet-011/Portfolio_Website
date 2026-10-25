import { describe, expect, it } from "vitest";
import { depsFromEnv, siteLimits } from "./deps";
import { freeTierLimits } from "./limits";
import { PROVIDERS, providerSpec } from "./provider";

const upstash = {
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "t",
  IP_HASH_SALT: "s",
};
const limits = { ASSISTANT_DAILY_CAP: "400", ASSISTANT_PER_MINUTE: "8" };

describe("depsFromEnv", () => {
  it("uses Gemini 3.5 Flash-Lite at minimal thinking by default", () => {
    const deps = depsFromEnv({ GEMINI_API_KEY: "k" });
    expect(deps.provider).toMatchObject({
      model: "gemini-3.5-flash-lite",
      effort: null,
      thinking: "minimal",
    });
  });

  it("switches to Claude with ASSISTANT_PROVIDER=anthropic and its own key", () => {
    expect(
      depsFromEnv({ ASSISTANT_PROVIDER: "anthropic", GEMINI_API_KEY: "k" }).provider,
    ).toBeNull();
    const deps = depsFromEnv({ ASSISTANT_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "k" });
    expect(deps.provider).toMatchObject({
      model: "claude-haiku-5-5",
      effort: "low",
      thinking: "off",
    });
  });

  it("fails closed on an unknown provider name", () => {
    expect(depsFromEnv({ ASSISTANT_PROVIDER: "gemni", GEMINI_API_KEY: "k" }).provider).toBeNull();
  });

  it("accepts only the provider's own thinking modes", () => {
    expect(depsFromEnv({ GEMINI_API_KEY: "k", ASSISTANT_THINKING: "low" }).provider?.thinking).toBe(
      "low",
    );
    expect(
      depsFromEnv({ GEMINI_API_KEY: "k", ASSISTANT_THINKING: "adaptive" }).provider?.thinking,
    ).toBe("minimal");
  });

  it("fails closed on Vercel without Upstash, the IP salt, or known limits", () => {
    expect(depsFromEnv({ VERCEL: "1", GEMINI_API_KEY: "k", ...limits }).provider).toBeNull();
    expect(
      depsFromEnv({
        VERCEL: "1",
        GEMINI_API_KEY: "k",
        ...limits,
        ...upstash,
        IP_HASH_SALT: undefined,
      }).provider,
    ).toBeNull();
  });

  it("runs Gemini on Vercel at 80% of its recorded free tier, with no limit env vars", () => {
    expect(PROVIDERS.gemini.freeTier).toMatchObject({ rpm: 15, tpm: 250_000, rpd: 500 });
    expect(depsFromEnv({ VERCEL: "1", GEMINI_API_KEY: "k", ...upstash }).provider).not.toBeNull();
    const spec = providerSpec("gemini");
    expect(spec && siteLimits(spec, {})).toEqual({ dailyCap: 400, perMinute: 12 });
  });

  it("runs on Vercel with the key, Upstash, the salt and limits", () => {
    const deps = depsFromEnv({ VERCEL: "1", GEMINI_API_KEY: "k", ...upstash, ...limits });
    expect(deps.provider?.model).toBe("gemini-3.5-flash-lite");
    expect(deps.onVercel).toBe(true);
  });

  it("needs only the key locally, with limits in memory", () => {
    expect(depsFromEnv({}).provider).toBeNull();
    const deps = depsFromEnv({ GEMINI_API_KEY: "k" });
    expect(deps.provider).not.toBeNull();
    expect(deps.onVercel).toBe(false);
  });
});

describe("siteLimits", () => {
  const gemini = providerSpec("gemini");
  if (!gemini) throw new Error("no gemini spec");

  it("keeps the site at about 80% of a free tier", () => {
    expect(freeTierLimits({ rpm: 15, rpd: 1000 })).toEqual({ dailyCap: 800, perMinute: 12 });
    expect(freeTierLimits({ rpm: 1, rpd: 1 })).toEqual({ dailyCap: 1, perMinute: 1 });
    expect(
      siteLimits({ ...gemini, freeTier: { rpm: 10, tpm: 1, rpd: 500, readOn: "x" } }, {}),
    ).toEqual({
      dailyCap: 400,
      perMinute: 8,
    });
  });

  it("lets env vars override, and is null while the free tier is unknown", () => {
    expect(siteLimits({ ...gemini, freeTier: null }, {})).toBeNull();
    expect(siteLimits({ ...gemini, freeTier: null }, limits)).toEqual({
      dailyCap: 400,
      perMinute: 8,
    });
  });
});
