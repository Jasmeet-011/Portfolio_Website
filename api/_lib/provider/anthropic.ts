import Anthropic from "@anthropic-ai/sdk";
import type { Provider, ProviderConfig, ProviderEvent, ProviderRequest } from "./types.js";

/** Claude's effort setting for the assistant: short grounded answers need little. */
const EFFORT = "low";

/**
 * The Claude API through the official SDK. The grounding goes in as one document with a
 * content block per section and citations on, so every citation names a real section
 * (content_block_location indexes). The document carries the cache breakpoint: system
 * prompt plus document are the same on every request, so after the first call they are
 * read from the prompt cache.
 */
export function anthropicProvider(config: ProviderConfig): Provider {
  const client = new Anthropic({ apiKey: config.apiKey, maxRetries: 1, timeout: 30_000 });

  function messages(request: ProviderRequest): Anthropic.MessageParam[] {
    const document: Anthropic.DocumentBlockParam = {
      type: "document",
      title: request.documentTitle,
      source: {
        type: "content",
        content: request.sections.map((text) => ({ type: "text", text })),
      },
      citations: { enabled: true },
      cache_control: { type: "ephemeral" },
    };
    const turns = [...request.history, { role: "user" as const, text: request.question }];
    return turns.map((turn, i): Anthropic.MessageParam =>
      i === 0
        ? { role: "user", content: [document, { type: "text", text: turn.text }] }
        : { role: turn.role, content: turn.text },
    );
  }

  return {
    model: config.model,
    effort: EFFORT,
    thinking: config.thinking,
    async *stream(request, signal): AsyncIterable<ProviderEvent> {
      const stream = client.messages.stream(
        {
          model: config.model,
          max_tokens: request.maxTokens,
          system: request.system,
          messages: messages(request),
          output_config: { effort: EFFORT },
          // Claude Haiku 5.5 thinks by default; "off" is allowed at effort high or below.
          ...(config.thinking === "off" ? { thinking: { type: "disabled" } } : {}),
        },
        { signal },
      );
      for await (const event of stream) {
        if (event.type !== "content_block_delta") continue;
        if (event.delta.type === "text_delta") yield { type: "text", text: event.delta.text };
        else if (
          event.delta.type === "citations_delta" &&
          event.delta.citation.type === "content_block_location"
        ) {
          const { start_block_index, end_block_index } = event.delta.citation;
          for (let i = start_block_index; i < end_block_index; i++)
            yield { type: "citation", index: i };
        }
      }
      const final = await stream.finalMessage();
      yield {
        type: "end",
        stopReason: final.stop_reason,
        usage: {
          inputTokens: final.usage.input_tokens,
          outputTokens: final.usage.output_tokens,
          cacheReadTokens: final.usage.cache_read_input_tokens ?? 0,
          cacheWriteTokens: final.usage.cache_creation_input_tokens ?? 0,
        },
      };
    },
  };
}
