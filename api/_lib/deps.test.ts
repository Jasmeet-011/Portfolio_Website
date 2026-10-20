import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL, depsFromEnv } from "./deps";

describe("depsFromEnv", () => {
  it("fails closed on Vercel without Upstash or the IP salt", () => {
    expect(depsFromEnv({ VERCEL: "1", ANTHROPIC_API_KEY: "k" }).provider).toBeNull();
    expect(
      depsFromEnv({
        VERCEL: "1",
        ANTHROPIC_API_KEY: "k",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "t",
      }).provider,
    ).toBeNull();
  });

  it("runs on Vercel with the key, Upstash and the salt", () => {
    const deps = depsFromEnv({
      VERCEL: "1",
      ANTHROPIC_API_KEY: "k",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "t",
      IP_HASH_SALT: "s",
    });
    expect(deps.provider?.model).toBe(DEFAULT_MODEL);
    expect(deps.onVercel).toBe(true);
  });

  it("needs only the key locally, with limits in memory", () => {
    expect(depsFromEnv({}).provider).toBeNull();
    const deps = depsFromEnv({ ANTHROPIC_API_KEY: "k", ASSISTANT_THINKING: "adaptive" });
    expect(deps.provider?.thinking).toBe("adaptive");
    expect(deps.onVercel).toBe(false);
  });

  it("uses the small fast model at low effort by default", () => {
    const deps = depsFromEnv({ ANTHROPIC_API_KEY: "k" });
    expect(deps.provider).toMatchObject({ model: "claude-haiku-5-5", effort: "low" });
  });
});
