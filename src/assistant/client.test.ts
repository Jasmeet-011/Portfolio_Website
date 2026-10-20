import { describe, expect, it } from "vitest";
import { splitSse } from "./client";

describe("splitSse", () => {
  it("returns complete events and keeps a partial one for the next chunk", () => {
    const a = 'data: {"type":"text","text":"Hi"}\n\ndata: {"type":"te';
    const first = splitSse(a);
    expect(first.events).toEqual([{ type: "text", text: "Hi" }]);
    const second = splitSse(`${first.rest}xt","text":" there"}\n\n`);
    expect(second.events).toEqual([{ type: "text", text: " there" }]);
    expect(second.rest).toBe("");
  });
});
