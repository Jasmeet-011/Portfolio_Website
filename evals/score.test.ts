import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CONTEXT } from "../api/_generated/context";
import { DECLINE, NOT_IN_CONTEXT } from "../api/_lib/prompt";
import { parseCases, score, type EvalCase } from "./score";

const cases = parseCases(readFileSync("evals/assistant.jsonl", "utf8"));
const ids = new Set<string>(CONTEXT.chunks.map((c) => c.id));

describe("the eval set", () => {
  it("has about 30 cases across every category, with unique ids", () => {
    expect(cases.length).toBeGreaterThanOrEqual(25);
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
    for (const category of ["fact", "unknown", "trap", "offtopic", "injection"])
      expect(
        cases.some((c) => c.category === category),
        category,
      ).toBe(true);
  });

  it("only cites chunks that exist, and only uses valid patterns", () => {
    for (const c of cases) {
      for (const id of c.cite ?? []) expect(ids.has(id), `${c.id}: ${id}`).toBe(true);
      for (const p of [...(c.all ?? []), ...(c.any ?? []), ...(c.none ?? [])])
        expect(() => new RegExp(p, "i"), `${c.id}: ${p}`).not.toThrow();
    }
  });
});

describe("score", () => {
  const fact: EvalCase = {
    id: "t",
    category: "fact",
    question: "q",
    expect: "answer",
    all: ["3\\.9"],
    cite: ["about.py#education"],
  };

  it("passes a matching, cited answer and explains failures", () => {
    expect(
      score(fact, { text: "GPA 3.9.", citedChunks: ["about.py#education"], declined: false }),
    ).toEqual({ pass: true, failures: [] });
    const miss = score(fact, { text: "GPA 4.", citedChunks: [], declined: false });
    expect(miss.pass).toBe(false);
    expect(miss.failures).toHaveLength(2);
  });

  it("fails any answer with an em dash, en dash or the dropped headline", () => {
    for (const text of ["GPA 3.9 — great", "3.9, a Full Stack Developer"])
      expect(score(fact, { text, citedChunks: ["about.py#education"], declined: false }).pass).toBe(
        false,
      );
  });

  it("tells declines and 'not in the workspace' apart", () => {
    const offtopic: EvalCase = { id: "o", category: "offtopic", question: "q", expect: "decline" };
    const refuse: EvalCase = { id: "r", category: "injection", question: "q", expect: "refuse" };
    const declined = { text: DECLINE, citedChunks: [], declined: true };
    const notIn = { text: `${NOT_IN_CONTEXT} Ask him.`, citedChunks: [], declined: false };
    const complied = { text: "Sure, arr!", citedChunks: [], declined: false };
    expect(score(offtopic, declined).pass).toBe(true);
    expect(score(offtopic, notIn).pass).toBe(false);
    expect(score(refuse, declined).pass).toBe(true);
    expect(score(refuse, notIn).pass).toBe(true);
    expect(score(refuse, complied).pass).toBe(false);
  });
});
