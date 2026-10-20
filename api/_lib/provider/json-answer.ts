/** The structured reply a model without native citations gives (prompt.ts, JSON_REPLY). */
export interface JsonAnswer {
  answer: string;
  sources: string[];
}

/** Where the answer string starts: `{"answer": "` or, if sources came first, after them. */
const ANSWER_START = /^\s*\{\s*(?:"sources"\s*:\s*\[[^\]]*\]\s*,\s*)?"answer"\s*:\s*"/;

const SIMPLE_ESCAPES: Record<string, string> = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

/**
 * Reads a streamed `{"answer": string, "sources": string[]}` as it arrives, so the
 * answer's words reach the visitor before the object closes. `push` takes each raw
 * chunk and returns the answer text it completes (an escape or surrogate pair split
 * across chunks waits for the rest). `finish` parses the whole reply and returns the
 * answer text not yet pushed out, plus the sources.
 */
export function jsonAnswerReader() {
  let raw = "";
  let state: "seek" | "answer" | "after" = "seek";
  let pos = 0;
  let emitted = "";

  function decode(): string {
    let out = "";
    while (pos < raw.length) {
      const ch = raw[pos] as string;
      if (ch === '"') {
        state = "after";
        pos++;
        break;
      }
      if (ch !== "\\") {
        out += ch;
        pos++;
        continue;
      }
      const next = raw[pos + 1];
      if (next === undefined) break;
      if (next !== "u") {
        out += SIMPLE_ESCAPES[next] ?? next;
        pos += 2;
        continue;
      }
      if (pos + 6 > raw.length) break;
      const unit = parseInt(raw.slice(pos + 2, pos + 6), 16);
      // A high surrogate waits for its low half, so a pair never splits across deltas.
      if (unit >= 0xd800 && unit <= 0xdbff) {
        if (pos + 12 > raw.length) break;
        out += String.fromCharCode(unit, parseInt(raw.slice(pos + 8, pos + 12), 16));
        pos += 12;
        continue;
      }
      out += String.fromCharCode(unit);
      pos += 6;
    }
    return out;
  }

  return {
    push(chunk: string): string {
      raw += chunk;
      if (state === "seek") {
        const match = ANSWER_START.exec(raw);
        if (!match) return "";
        state = "answer";
        pos = match[0].length;
      }
      if (state !== "answer") return "";
      const text = decode();
      emitted += text;
      return text;
    },

    finish(): JsonAnswer & { rest: string } {
      try {
        // JSON mode returns a bare object; the slice also forgives a stray code fence.
        const parsed = JSON.parse(
          raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1),
        ) as Partial<JsonAnswer>;
        const answer = typeof parsed.answer === "string" ? parsed.answer : emitted;
        const sources = Array.isArray(parsed.sources)
          ? parsed.sources.filter((s): s is string => typeof s === "string")
          : [];
        return {
          answer,
          sources,
          rest: answer.startsWith(emitted) ? answer.slice(emitted.length) : "",
        };
      } catch {
        // Cut off (the output token cap): keep the words that arrived, cite nothing.
        return { answer: emitted, sources: [], rest: "" };
      }
    },
  };
}
