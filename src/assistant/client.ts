import type { AssistantRequest, ErrorBody, StreamEvent } from "../../api/_lib/protocol";

/** Splits a text/event-stream buffer into complete events and the unfinished rest. */
export function splitSse(buffer: string): { events: StreamEvent[]; rest: string } {
  const events: StreamEvent[] = [];
  let rest = buffer;
  for (let end = rest.indexOf("\n\n"); end >= 0; end = rest.indexOf("\n\n")) {
    const block = rest.slice(0, end);
    rest = rest.slice(end + 2);
    if (block.startsWith("data: ")) events.push(JSON.parse(block.slice(6)) as StreamEvent);
  }
  return { events, rest };
}

/**
 * Sends one request to /api/copilot and reports what comes back. A JSON error from
 * before the answer started (limits, validation, not configured) arrives as `onError`;
 * everything else is a stream event.
 */
export async function requestAnswer(
  body: AssistantRequest,
  handlers: { onEvent: (event: StreamEvent) => void; onError: (error: ErrorBody) => void },
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/copilot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    if (signal?.aborted) return;
    handlers.onError({
      code: "upstream",
      message: "Couldn't reach the assistant. Check your connection.",
    });
    return;
  }
  if (!response.ok || !response.body) {
    const error = (await response.json().catch(() => null)) as ErrorBody | null;
    handlers.onError(
      error ?? { code: "upstream", message: "The assistant couldn't answer just now." },
    );
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read().catch(() => ({ done: true, value: undefined }));
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = splitSse(buffer);
    buffer = rest;
    for (const event of events) handlers.onEvent(event);
  }
}
