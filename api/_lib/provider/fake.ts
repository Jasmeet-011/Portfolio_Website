import type { Provider, ProviderEvent, ProviderRequest } from "./types.js";

/** A scripted provider for tests: replays `events` and records what it was asked. */
export function fakeProvider(events: ProviderEvent[] = defaultEvents()): Provider & {
  calls: ProviderRequest[];
} {
  const calls: ProviderRequest[] = [];
  return {
    model: "fake-model",
    effort: "low",
    thinking: "off",
    calls,
    async *stream(request) {
      calls.push(request);
      for (const event of events) yield event;
    },
  };
}

export function defaultEvents(): ProviderEvent[] {
  return [
    { type: "text", text: "Jasmeet built a research assistant." },
    { type: "citation", index: 0 },
    {
      type: "end",
      stopReason: "end_turn",
      usage: { inputTokens: 100, outputTokens: 20, cacheReadTokens: 80, cacheWriteTokens: 0 },
    },
  ];
}
