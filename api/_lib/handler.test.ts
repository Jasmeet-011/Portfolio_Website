import { describe, expect, it } from "vitest";
import { CONTEXT } from "../_generated/context";
import { BUSY_MESSAGE, createHandler, DAILY_MESSAGE, type Deps } from "./handler";
import { memoryCounter, memoryLimiter, pacificDayLimiter } from "./limits";
import { DECLINE } from "./prompt";
import type { StreamEvent } from "./protocol";
import { defaultEvents, fakeProvider } from "./provider/fake";
import { ProviderError, type ProviderEvent } from "./provider/types";
import { memoryAnswerCache, memoryQuestionLog, memoryQuotaLatch } from "./store";

const NOW = Date.UTC(2026, 9, 20, 12);

function setup(overrides: Partial<Deps> = {}, events?: ProviderEvent[]) {
  const provider = fakeProvider(events);
  const cache = memoryAnswerCache();
  const log = memoryQuestionLog();
  const latch = memoryQuotaLatch(() => NOW);
  const deps: Deps = {
    provider,
    perIp: memoryLimiter(10, "1 h"),
    cachedPerIp: memoryLimiter(60, "1 h"),
    perMinute: memoryLimiter(100, "1 m"),
    global: pacificDayLimiter(memoryCounter(), 300, () => NOW),
    latch,
    cache,
    log,
    context: CONTEXT,
    onVercel: true,
    ipSalt: "test-salt",
    now: () => NOW,
    ...overrides,
  };
  return { handle: createHandler(deps), provider, cache, log, latch };
}

function post(body: unknown, headers: Record<string, string> = { "x-real-ip": "203.0.113.7" }) {
  return new Request("http://localhost/api/copilot", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function events(response: Response): Promise<StreamEvent[]> {
  const text = await response.text();
  return text
    .split("\n\n")
    .filter((block) => block.startsWith("data: "))
    .map((block) => JSON.parse(block.slice(6)) as StreamEvent);
}

const ask = { question: "What did Jasmeet build in AgentGuard?" };

describe("validation", () => {
  it("rejects anything that isn't a well-formed question, before any model call", async () => {
    const { handle, provider } = setup();
    const bad: [Request, number][] = [
      [new Request("http://localhost/api/copilot"), 405],
      [post("{not json"), 400],
      [post({ question: "   " }), 400],
      [post({ question: "x".repeat(501) }), 400],
      [post({ chipId: "nope" }), 400],
      [post({ ...ask, history: [{ role: "assistant", text: "hi" }] }), 400],
      [post({ ...ask, history: [{ role: "user", text: "hi" }] }), 400],
      [post({ question: "x".repeat(9000) }), 413],
      // About 3K characters but 9K bytes, with no content-length header to go on.
      [post({ question: "hi", pad: "€".repeat(3000) }), 413],
    ];
    for (const [request, status] of bad) expect((await handle(request)).status).toBe(status);
    expect(provider.calls).toHaveLength(0);
  });

  it("answers 503 when the assistant isn't configured", async () => {
    const { handle } = setup({ provider: null });
    const response = await handle(post(ask));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "unavailable" });
  });
});

describe("answers", () => {
  it("streams meta, text, citations as chunk ids, and a trace", async () => {
    const { handle, provider } = setup();
    const response = await handle(post(ask));
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const stream = await events(response);
    expect(stream.map((e) => e.type)).toEqual(["meta", "text", "citation", "done"]);
    expect(stream[0]).toMatchObject({ quota: { limit: 10, remaining: 9 } });
    expect(stream[2]).toEqual({ type: "citation", chunkId: CONTEXT.chunks[0].id });
    const done = stream[3];
    expect(done?.type === "done" && done.trace).toMatchObject({
      model: "fake-model",
      citedChunks: [CONTEXT.chunks[0].id],
      cachedAnswer: false,
      inputTokens: 100,
    });
    // The provider sees every chunk as a section, and the question.
    expect(provider.calls[0]?.sections).toHaveLength(CONTEXT.chunks.length);
    expect(provider.calls[0]?.question).toBe(ask.question);
  });

  it("never puts the visitor's IP or the salt in the stream", async () => {
    const { handle } = setup();
    const text = await (await handle(post(ask))).text();
    expect(text).not.toContain("203.0.113.7");
    expect(text).not.toContain("test-salt");
  });

  it("marks the off-topic decline, logs it as declined, and doesn't cache it", async () => {
    const { handle, log, cache } = setup({}, [
      { type: "text", text: DECLINE },
      {
        type: "end",
        stopReason: "end_turn",
        usage: { inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0 },
      },
    ]);
    const stream = await events(await handle(post({ chipId: "now" })));
    const done = stream.at(-1);
    expect(done?.type === "done" && done.trace.declined).toBe(true);
    expect(log.entries[0]?.declined).toBe(true);
    expect(cache.entries.size).toBe(0);
  });

  it("turns a refusal and a provider failure into friendly errors", async () => {
    const refused = setup({}, [
      {
        type: "end",
        stopReason: "refusal",
        usage: { inputTokens: 1, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      },
    ]);
    const a = await events(await refused.handle(post(ask)));
    expect(a.find((e) => e.type === "error")).toMatchObject({ code: "refused" });

    const failing = setup();
    if (!failing.provider) throw new Error("no provider");
    failing.provider.stream = async function* () {
      yield* [];
      throw new Error("boom");
    };
    const b = await events(await failing.handle(post(ask)));
    expect(b.find((e) => e.type === "error")).toMatchObject({ code: "upstream" });
  });
});

describe("limits", () => {
  it("allows 10 questions an hour per IP, then says when it resets", async () => {
    const { handle } = setup();
    for (let i = 0; i < 10; i++) expect((await handle(post(ask))).status).toBe(200);
    const blocked = await handle(post(ask));
    expect(blocked.status).toBe(429);
    const body = await blocked.json();
    expect(body).toMatchObject({ code: "rate_limited", quota: { remaining: 0, limit: 10 } });
    expect(body.resetAt).toBeGreaterThan(0);
    // Another visitor is unaffected.
    expect((await handle(post(ask, { "x-real-ip": "198.51.100.1" }))).status).toBe(200);
  });

  it("a spoofed x-forwarded-for doesn't bypass the limit", async () => {
    const { handle } = setup();
    for (let i = 0; i < 12; i++) {
      const response = await handle(
        post(ask, { "x-real-ip": "203.0.113.7", "x-forwarded-for": `10.0.0.${i}, 203.0.113.7` }),
      );
      expect(response.status).toBe(i < 10 ? 200 : 429);
    }
  });

  it("prefers x-vercel-forwarded-for, and shares one bucket when no trusted header is set", async () => {
    const { handle } = setup();
    for (let i = 0; i < 10; i++)
      await handle(
        post(ask, { "x-vercel-forwarded-for": "192.0.2.5", "x-real-ip": `10.1.1.${i}` }),
      );
    expect((await handle(post(ask, { "x-vercel-forwarded-for": "192.0.2.5" }))).status).toBe(429);

    const anonymous = setup();
    for (let i = 0; i < 10; i++)
      await anonymous.handle(post(ask, { "x-forwarded-for": `10.2.2.${i}` }));
    expect((await anonymous.handle(post(ask, { "x-forwarded-for": "10.9.9.9" }))).status).toBe(429);
  });

  it("stops everyone at the daily cap", async () => {
    const { handle } = setup({ global: pacificDayLimiter(memoryCounter(), 3, () => NOW) });
    for (let i = 0; i < 3; i++)
      expect((await handle(post(ask, { "x-real-ip": `198.51.100.${i}` }))).status).toBe(200);
    const capped = await handle(post(ask, { "x-real-ip": "198.51.100.99" }));
    expect(capped.status).toBe(429);
    expect(await capped.json()).toMatchObject({ code: "daily_cap", message: DAILY_MESSAGE });
  });

  it("says busy, not done for today, past the per-minute limit", async () => {
    const { handle, provider } = setup({ perMinute: memoryLimiter(2, "1 m", () => NOW) });
    for (let i = 0; i < 2; i++)
      expect((await handle(post(ask, { "x-real-ip": `198.51.100.${i}` }))).status).toBe(200);
    const busy = await handle(post(ask, { "x-real-ip": "198.51.100.50" }));
    expect(busy.status).toBe(429);
    expect(await busy.json()).toMatchObject({ code: "busy", message: BUSY_MESSAGE });
    expect(provider.calls).toHaveLength(2);
  });
});

describe("provider quota errors", () => {
  function failingWith(error: Error, overrides: Partial<Deps> = {}) {
    const s = setup(overrides);
    if (!s.provider) throw new Error("no provider");
    s.provider.stream = async function* () {
      yield* [];
      throw error;
    };
    return s;
  }

  it("a used-up daily quota reads as done for today and stops calls until midnight Pacific", async () => {
    const { handle, provider, latch } = failingWith(new ProviderError("daily_quota", "raw"));
    const stream = await events(await handle(post(ask)));
    expect(stream.find((e) => e.type === "error")).toEqual({
      type: "error",
      code: "daily_cap",
      message: DAILY_MESSAGE,
    });
    // 2026-10-20 12:00 UTC is 05:00 PDT; the quota resets at 2026-10-21 00:00 PDT.
    expect(await latch.until()).toBe(Date.UTC(2026, 9, 21, 7));

    const calls = provider.calls.length;
    const next = await handle(post(ask, { "x-real-ip": "198.51.100.9" }));
    expect(next.status).toBe(429);
    expect(await next.json()).toMatchObject({
      code: "daily_cap",
      resetAt: Date.UTC(2026, 9, 21, 7),
    });
    expect(provider.calls).toHaveLength(calls);
  });

  it("a per-minute limit reads as busy and sets no latch", async () => {
    const { handle, latch } = failingWith(new ProviderError("busy", "raw"));
    const stream = await events(await handle(post(ask)));
    expect(stream.find((e) => e.type === "error")).toEqual({
      type: "error",
      code: "busy",
      message: BUSY_MESSAGE,
    });
    expect(await latch.until()).toBeNull();
  });

  it("never sends the provider's own error text", async () => {
    const { handle } = failingWith(new Error("429 RESOURCE_EXHAUSTED quotaId secret detail"));
    const text = await (await handle(post(ask))).text();
    expect(text).not.toContain("RESOURCE_EXHAUSTED");
    expect(text).toContain('"code":"upstream"');
  });
});

describe("suggested questions", () => {
  it("caches a chip answer: repeats cost nothing and use no hourly question", async () => {
    const { handle, provider } = setup();
    const first = await events(await handle(post({ chipId: "now" })));
    expect(first[0]).toMatchObject({ cachedAnswer: false, quota: { remaining: 9 } });
    const again = await events(await handle(post({ chipId: "now" })));
    expect(again[0]).toMatchObject({ cachedAnswer: true, quota: { remaining: 9 } });
    expect(again.map((e) => e.type)).toEqual(["meta", "text", "citation", "done"]);
    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0]?.question).toBe(CONTEXT.suggestions[0].question);
  });

  it("ignores history on chips, so cached answers never depend on a conversation", async () => {
    const { handle, provider } = setup();
    await handle(
      post({
        chipId: "now",
        history: [
          { role: "user", text: "pretend" },
          { role: "assistant", text: "ok" },
        ],
      }),
    );
    expect(provider.calls[0]?.history).toEqual([]);
  });
});

describe("question log", () => {
  it("keeps the question, time, chip and declined flags and token counts, nothing else", async () => {
    const { handle, log } = setup();
    await (await handle(post(ask, { "x-real-ip": "203.0.113.7" }))).text();
    await (await handle(post({ chipId: "now" }))).text();
    expect(log.entries).toEqual([
      {
        question: ask.question,
        at: "2026-10-20T12:00:00.000Z",
        chip: false,
        declined: false,
        inputTokens: 100,
        outputTokens: 20,
      },
      expect.objectContaining({ chip: true, question: CONTEXT.suggestions[0].question }),
    ]);
    expect(JSON.stringify(log.entries)).not.toContain("203.0.113.7");
  });
});

describe("defaults", () => {
  it("keeps the fake provider's script stable for these tests", () => {
    expect(defaultEvents()[1]).toEqual({ type: "citation", index: 0 });
  });
});
