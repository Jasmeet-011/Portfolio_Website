import { describe, expect, it, vi } from "vitest";
import { certifications, degrees, publications } from "@/content/education";
import { roles } from "@/content/experience";
import { links } from "@/content/links";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import marks from "@/assets/logo/marks.json";
import { ART, complete, execute, type TerminalContext } from "./commands";
import type { Segment } from "./store";

function context(overrides: Partial<TerminalContext> = {}): TerminalContext {
  return {
    open: vi.fn(),
    openExternal: vi.fn(),
    now: () => new Date(2026, 9, 19, 22, 31, 5),
    columns: 120,
    ask: vi.fn(),
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

const NL = String.fromCharCode(10);

describe("phase 4.5 commands", () => {
  it("neofetch draws the site's chosen mark, J_", () => {
    expect(marks.chosen).toBe("prompt");
    const narrow = run("neofetch", context({ columns: 40 }));
    expect(narrow.slice(0, ART.length)).toEqual(ART);
    expect(ART.join("")).toContain("_____");
  });

  it("neofetch shows the card beside the art when wide, below it when narrow", () => {
    const wide = run("neofetch");
    expect(wide.join(NL)).toContain(profile.name);
    expect(wide.join(NL)).toContain(profile.location);
    expect(wide.join(NL)).toContain(links.email);
    expect(wide[0]).toContain("jasmeet@portfolio");
    const narrow = run("neofetch", context({ columns: 40 }));
    expect(narrow[0]).not.toContain("jasmeet@portfolio");
    expect(narrow.join(NL)).toContain(profile.name);
  });

  it("open takes github, linkedin, email and project slugs", () => {
    const ctx = context();
    run("open github", ctx);
    run("open LinkedIn", ctx);
    run("open email", ctx);
    expect(ctx.openExternal).toHaveBeenNthCalledWith(1, links.github);
    expect(ctx.openExternal).toHaveBeenNthCalledWith(2, links.linkedin);
    expect(ctx.openExternal).toHaveBeenNthCalledWith(3, `mailto:${links.email}`);
  });

  it("open <project> opens its live app only after a passing check, else its repo", () => {
    for (const p of projects) {
      const ctx = context();
      run(`open ${p.slug}`, ctx);
      const live = p.links.live && p.liveCheck?.ok ? p.links.live : undefined;
      expect(ctx.openExternal).toHaveBeenCalledWith(live ?? p.links.github);
    }
  });

  it("open still prefers files, and reports unknown targets", () => {
    const ctx = context();
    run("open about.py", ctx);
    expect(ctx.open).toHaveBeenCalledWith("/about");
    expect(ctx.openExternal).not.toHaveBeenCalled();
    expect(run("open nowhere")).toEqual(["open: nowhere: No such file or link"]);
  });

  it("cat opens files only", () => {
    expect(run("cat github")).toEqual(["cat: github: No such file"]);
  });

  it("education and certs print degrees, the certification and the paper", () => {
    const education = run("education").join(NL);
    for (const d of degrees) expect(education).toContain(d.school);
    const certs = run("certs").join(NL);
    for (const c of certifications) expect(certs).toContain(c.name);
    for (const p of publications) expect(certs).toContain(p.title);
  });

  it("echo, date and pwd", () => {
    expect(run('echo "hello there"')).toEqual(["hello there"]);
    expect(run("date")).toEqual(["Mon Oct 19 22:31:05 2026"]);
    expect(run("pwd")).toEqual(["/home/jasmeet"]);
  });

  it("sudo refuses, playfully", () => {
    expect(run("sudo rm -rf /")[0]).toMatch(/^Nice try[.]/);
  });

  it("help lists every new command, and Tab completes them", () => {
    const help = run("help").join(NL);
    for (const name of ["neofetch", "education", "certs", "echo", "date", "pwd", "sudo"])
      expect(help).toContain(name);
    expect(complete("neo").value).toBe("neofetch ");
    expect(complete("open git").value).toBe("open github ");
    // The project slug and the file share a prefix: the first Tab extends to it, the next lists both.
    expect(complete("open agentg").value).toBe("open agentguard");
    expect(complete("open agentguard").options).toEqual(["agentguard", "agentguard.py"]);
  });
});

describe("ask", () => {
  it("sends the question, without surrounding quotes, to the assistant", () => {
    const ctx = context();
    expect(run('ask "What did Jasmeet build in AgentGuard?"', ctx)).toEqual([]);
    expect(ctx.ask).toHaveBeenCalledWith("What did Jasmeet build in AgentGuard?");
  });

  it("shows usage when there is no question, and is in help and completion", () => {
    expect(run("ask")[0]).toMatch(/^usage: ask/);
    expect(run("help").join("|")).toContain("ask <question>");
    expect(complete("as").value).toBe("ask ");
  });
});
