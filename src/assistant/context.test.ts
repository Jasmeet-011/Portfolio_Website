import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CONTEXT } from "../../api/_generated/context";
import { projects } from "@/content/projects";
import { docForPath } from "@/workspace/documents";
import { buildChunks, buildSuggestions } from "./context";

const chunks = buildChunks();

describe("assistant context", () => {
  it("gives every chunk a unique id and a route that opens a real file or view", () => {
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length);
    for (const c of chunks) expect(docForPath(c.route.split("#")[0] ?? ""), c.id).toBeDefined();
  });

  it("leaves out Todo fields and live links whose check failed", () => {
    const all = JSON.stringify(chunks);
    expect(all).not.toContain("TODO(jasmeet)");
    for (const p of projects.filter((x) => x.links.live && !x.liveCheck?.ok))
      expect(all).not.toContain(p.links.live);
  });

  it("covers every project, role and degree", () => {
    for (const p of projects) expect(chunks.some((c) => c.text.includes(p.name))).toBe(true);
    expect(chunks.filter((c) => c.id.startsWith("git-graph#"))).toHaveLength(3);
  });

  it("suggests what Jasmeet does now and the featured projects, never archived ones", () => {
    const ids = buildSuggestions().map((s) => s.id);
    expect(ids[0]).toBe("now");
    for (const p of projects)
      expect(ids.includes(`project-${p.slug}`)).toBe(p.featured && !p.archived);
  });

  it("matches the committed api/_generated/context.ts (run npm run build if this fails)", () => {
    const suggestions = buildSuggestions();
    const version = createHash("sha256")
      .update(JSON.stringify({ chunks, suggestions }))
      .digest("hex")
      .slice(0, 12);
    expect(CONTEXT).toEqual({ version, chunks, suggestions });
  });
});
