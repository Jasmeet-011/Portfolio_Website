import { describe, expect, it, vi } from "vitest";
import { roles } from "@/content/experience";
import { projects } from "@/content/projects";
import { complete, execute, type TerminalContext } from "./commands";
import type { Segment } from "./store";

function context(overrides: Partial<TerminalContext> = {}): TerminalContext {
  return {
    open: vi.fn(),
    setTheme: vi.fn(),
    currentTheme: "workspace-blue",
    closePanel: vi.fn(),
    history: [],
    ...overrides,
  };
}

/** Output as plain text, one string per line. */
function run(input: string, ctx = context()): string[] {
  const out = execute(input, ctx);
  if (out === "clear") return ["<clear>"];
  return out.map((line: Segment[]) => line.map((s) => s.text).join(""));
}

describe("execute", () => {
  it("answers unknown commands with a hint", () => {
    expect(run("frobnicate")).toEqual(["command not found: frobnicate. Try help."]);
  });

  it("prints nothing for an empty line", () => {
    expect(run("   ")).toEqual([]);
  });

  it("git log has one line per role and degree, newest first", () => {
    const out = run("git log");
    for (const r of roles) expect(out.join("\n")).toContain(`${r.title} @ ${r.company}`);
    expect(out[0]).toContain("(HEAD -> main)");
  });

  it("projects lists every project", () => {
    const out = run("projects").join("\n");
    for (const p of projects) expect(out).toContain(p.name);
  });

  it("open resolves paths and bare file names, and refuses folders", () => {
    const ctx = context();
    run("open about.py", ctx);
    run("cat agentguard.py", ctx);
    expect(ctx.open).toHaveBeenNthCalledWith(1, "/about");
    expect(ctx.open).toHaveBeenNthCalledWith(2, "/projects/agentguard");
    expect(run("open projects")).toEqual(["open: projects: Is a directory"]);
  });

  it("theme switches by id or label", () => {
    const ctx = context();
    run("theme High-Contrast", ctx);
    expect(ctx.setTheme).toHaveBeenCalledWith("high-contrast");
  });

  it("clear asks the terminal to clear", () => {
    expect(run("clear")).toEqual(["<clear>"]);
  });
});

describe("complete", () => {
  it("completes a unique command with a trailing space", () => {
    expect(complete("who")).toEqual({ value: "whoami ", options: [] });
  });

  it("completes folders without a trailing space", () => {
    expect(complete("ls proj").value).toBe("ls projects/");
  });

  it("lists options when nothing more can be added", () => {
    expect(complete("c").options).toEqual(expect.arrayContaining(["cat", "clear", "contact"]));
  });

  it("leaves input alone when nothing matches", () => {
    expect(complete("zzz")).toEqual({ value: "zzz", options: [] });
  });
});
