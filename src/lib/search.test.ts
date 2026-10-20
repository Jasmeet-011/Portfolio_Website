import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects";
import { findState, MIN_QUERY, search } from "./search";

describe("search", () => {
  it("ignores queries shorter than the minimum", () => {
    expect(search("a".repeat(MIN_QUERY - 1))).toEqual([]);
  });

  it("is case-insensitive and groups by file", () => {
    const results = search("FASTAPI");
    const files = results.map((r) => r.doc.title);
    expect(files).toContain("chainlens.py");
    expect(new Set(files).size).toBe(files.length);
  });

  it("finds every project by its one-liner", () => {
    for (const p of projects) {
      const files = search(p.oneLiner.slice(0, 30)).map((r) => r.doc.title);
      expect(files).toContain(p.fileName);
    }
  });

  it("counts a string a file shows twice only once", () => {
    // Python is AgentGuard's language and also in its stack.
    const agentguard = search("python").find((r) => r.doc.title === "agentguard.py");
    expect(agentguard?.matches.filter((m) => m.text === "Python")).toHaveLength(1);
  });
});

describe("findState", () => {
  it("accepts a search result's navigation state and rejects anything else", () => {
    expect(findState({ find: "rag", text: "RAG" })).toEqual({ find: "rag", text: "RAG" });
    expect(findState({ closedAll: true })).toBeUndefined();
    expect(findState(null)).toBeUndefined();
  });
});
