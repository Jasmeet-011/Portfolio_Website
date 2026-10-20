import { describe, expect, it } from "vitest";
import { jsonAnswerReader } from "./json-answer";

/** Feeds `raw` in `size`-character chunks and returns every delta plus the finish. */
function feed(raw: string, size: number) {
  const reader = jsonAnswerReader();
  const deltas: string[] = [];
  for (let i = 0; i < raw.length; i += size) deltas.push(reader.push(raw.slice(i, i + size)));
  return { deltas, ...reader.finish() };
}

const reply = (answer: string, sources: string[] = ["about.py#bio"]) =>
  JSON.stringify({ answer, sources });

describe("jsonAnswerReader", () => {
  it("streams the answer before the object closes", () => {
    const reader = jsonAnswerReader();
    expect(reader.push('{"answer": "Jasmeet ')).toBe("Jasmeet ");
    expect(reader.push('is based in New York.", "sour')).toBe("is based in New York.");
    expect(reader.push('ces": ["about.py#bio"]}')).toBe("");
    expect(reader.finish()).toEqual({
      answer: "Jasmeet is based in New York.",
      sources: ["about.py#bio"],
      rest: "",
    });
  });

  it("gives the same text at every chunk size, escapes included", () => {
    const answer =
      'He said "hi"\\ok.\nLine two\ttab, a slash / and unicode: caf\u00e9, \u{1F680}, \u2028.';
    const raw = reply(answer).replace("\u00e9", "\\u00e9").replace("\u{1F680}", "\\ud83d\\ude80");
    for (const size of [1, 2, 3, 5, 7, 13, raw.length]) {
      const { deltas, answer: parsed, rest } = feed(raw, size);
      expect(deltas.join("") + rest, `chunk size ${size}`).toBe(answer);
      expect(parsed).toBe(answer);
    }
  });

  it("never emits half an escape or half a surrogate pair", () => {
    const raw = reply("a\nb \u{1F680}").replace("\u{1F680}", "\\ud83d\\ude80");
    for (let size = 1; size <= 4; size++)
      for (const delta of feed(raw, size).deltas) {
        expect(delta).not.toContain("\\");
        const last = delta.charCodeAt(delta.length - 1);
        expect(last >= 0xd800 && last <= 0xdbff, `size ${size}: ${delta}`).toBe(false);
      }
  });

  it("handles sources first, and whitespace between tokens", () => {
    const raw = '{ "sources" : [ "a#x", "b#y" ] ,\n  "answer" : "Two sources." }';
    const { deltas, sources } = feed(raw, 4);
    expect(deltas.join("")).toBe("Two sources.");
    expect(sources).toEqual(["a#x", "b#y"]);
  });

  it("keeps what arrived when the reply is cut off, and cites nothing", () => {
    const { deltas, answer, sources, rest } = feed('{"answer": "Cut off mid', 5);
    expect(deltas.join("")).toBe("Cut off mid");
    expect({ answer, sources, rest }).toEqual({ answer: "Cut off mid", sources: [], rest: "" });
  });

  it("returns the whole answer at finish when it never streamed", () => {
    const reader = jsonAnswerReader();
    expect(reader.push('```json\n{"answer": "Fenced."')).toBe("");
    reader.push(', "sources": []}\n```');
    expect(reader.finish()).toEqual({ answer: "Fenced.", sources: [], rest: "Fenced." });
  });

  it("drops non-string sources", () => {
    const { sources } = feed('{"answer": "x", "sources": ["a#b", 3, null]}', 64);
    expect(sources).toEqual(["a#b"]);
  });
});
