import { ApiError, ThinkingLevel, type GenerateContentResponse } from "@google/genai";
import { describe, expect, it } from "vitest";
import { classifyGeminiError, geminiProvider, geminiRequest, type GeminiModels } from "./gemini";
import { ProviderError, type ProviderEvent, type ProviderRequest } from "./types";

const REQUEST: ProviderRequest = {
  system: "Rules.",
  documentTitle: "Jasmeet's workspace",
  sections: ["[About]\nNew York.", "[AgentGuard: built]\nA pipeline."],
  sectionIds: ["about.py#bio", "projects/agentguard.py#built"],
  history: [
    { role: "user", text: "Hi" },
    { role: "assistant", text: "Hello." },
  ],
  question: "Where is he?",
  maxTokens: 1024,
};

const CONFIG = { apiKey: "k", model: "gemini-3.5-flash-lite", thinking: "minimal" };

/** A response chunk as the SDK yields it. */
const chunk = (text: string, extra: Partial<GenerateContentResponse> = {}) =>
  ({
    candidates: [{ content: { role: "model", parts: [{ text }] } }],
    ...extra,
  }) as GenerateContentResponse;

function fakeModels(chunks: GenerateContentResponse[] | Error) {
  const calls: unknown[] = [];
  const models: GeminiModels = {
    generateContentStream: async (params) => {
      calls.push(params);
      if (chunks instanceof Error) throw chunks;
      return (async function* () {
        yield* chunks;
      })();
    },
  };
  return { models, calls };
}

async function collect(chunks: GenerateContentResponse[] | Error) {
  const { models, calls } = fakeModels(chunks);
  const events: ProviderEvent[] = [];
  for await (const event of geminiProvider(CONFIG, models).stream(REQUEST)) events.push(event);
  return { events, calls };
}

const LAST = {
  candidates: [{ content: { role: "model", parts: [{ text: '"]}' }] }, finishReason: "STOP" }],
  usageMetadata: {
    promptTokenCount: 4000,
    cachedContentTokenCount: 3000,
    candidatesTokenCount: 60,
    thoughtsTokenCount: 25,
  },
} as GenerateContentResponse;

describe("geminiRequest", () => {
  const params = geminiRequest({ ...CONFIG, thinking: "low" }, REQUEST);

  it("puts every section with its id in the system instruction, after the rules", () => {
    const system = String(params.config?.systemInstruction);
    expect(system.startsWith("Rules.")).toBe(true);
    expect(system).toContain('<section id="about.py#bio">\n[About]\nNew York.\n</section>');
    expect(system).toContain('<section id="projects/agentguard.py#built">');
  });

  it("asks for JSON whose sources can only be real chunk ids", () => {
    expect(params.config).toMatchObject({
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseJsonSchema: {
        required: ["answer", "sources"],
        properties: { sources: { items: { enum: REQUEST.sectionIds } } },
      },
    });
  });

  it("sends history as user and model turns, then the question", () => {
    expect(params.contents).toEqual([
      { role: "user", parts: [{ text: "Hi" }] },
      { role: "model", parts: [{ text: "Hello." }] },
      { role: "user", parts: [{ text: "Where is he?" }] },
    ]);
  });
});

describe("geminiProvider", () => {
  it("streams the answer, then cites real sections and drops invented ones", async () => {
    const { events } = await collect([
      chunk('{"answer": "He is in '),
      chunk('New York.", "sources": ["about.py#bio", "made/up.py#x", "about.py#bio'),
      LAST,
    ]);
    expect(events).toEqual([
      { type: "text", text: "He is in " },
      { type: "text", text: "New York." },
      { type: "citation", index: 0 },
      {
        type: "end",
        stopReason: "end_turn",
        usage: {
          inputTokens: 1000,
          outputTokens: 85,
          cacheReadTokens: 3000,
          cacheWriteTokens: 0,
          thoughtTokens: 25,
        },
        unknownSources: ["made/up.py#x"],
      },
    ]);
  });

  it("skips thought parts", async () => {
    const thought = {
      candidates: [{ content: { parts: [{ text: "secret plan", thought: true }] } }],
    } as GenerateContentResponse;
    const { events } = await collect([thought, chunk('{"answer": "Hi.", "sources": []}')]);
    expect(events.filter((e) => e.type === "text")).toEqual([{ type: "text", text: "Hi." }]);
  });

  it("reports blocked replies as refusals and a cut-off as max_tokens", async () => {
    const blocked = await collect([
      { candidates: [{ finishReason: "SAFETY" }] } as GenerateContentResponse,
    ]);
    expect(blocked.events.at(-1)).toMatchObject({ type: "end", stopReason: "refusal" });
    const prompt = await collect([
      { promptFeedback: { blockReason: "PROHIBITED_CONTENT" } } as GenerateContentResponse,
    ]);
    expect(prompt.events.at(-1)).toMatchObject({ stopReason: "refusal" });
    const cut = await collect([
      {
        candidates: [
          { content: { parts: [{ text: '{"answer": "Long' }] }, finishReason: "MAX_TOKENS" },
        ],
      } as GenerateContentResponse,
    ]);
    expect(cut.events).toEqual([
      { type: "text", text: "Long" },
      expect.objectContaining({ type: "end", stopReason: "max_tokens", unknownSources: [] }),
    ]);
  });

  it("turns 429s into quota errors and passes anything else through", async () => {
    const daily = new ApiError({
      status: 429,
      message:
        '{"error":{"code":429,"status":"RESOURCE_EXHAUSTED","details":[{"violations":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}]}}',
    });
    const minute = new ApiError({
      status: 429,
      message:
        '{"error":{"details":[{"violations":[{"quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier"}]}]}}',
    });
    await expect(collect(daily)).rejects.toMatchObject({ kind: "daily_quota" });
    await expect(collect(minute)).rejects.toMatchObject({ kind: "busy" });
    expect(classifyGeminiError(new ApiError({ status: 429, message: "slow down" }))).toBeInstanceOf(
      ProviderError,
    );
    const server = new ApiError({ status: 500, message: "boom" });
    expect(classifyGeminiError(server)).toBe(server);
  });
});
