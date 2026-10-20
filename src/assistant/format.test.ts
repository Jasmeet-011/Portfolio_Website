import { describe, expect, it } from "vitest";
import { links } from "@/content/links";
import { blocks, chunkById, inlines } from "./format";

describe("answer formatting", () => {
  it("links URLs the content links to, and leaves any other URL as plain text", () => {
    const parts = inlines(`Code: ${links.github}. Also see https://evil.example/login now.`);
    expect(parts).toContainEqual({ type: "external", text: links.github, href: links.github });
    expect(parts.some((p) => p.type === "external" && p.href.includes("evil"))).toBe(false);
    expect(parts.map((p) => p.text).join("")).toContain("https://evil.example/login");
  });

  it("links the email and contact.http, and drops markdown bold", () => {
    const parts = inlines(`Write to ${links.email} or use **contact.http**.`);
    expect(parts).toContainEqual({
      type: "external",
      text: links.email,
      href: `mailto:${links.email}`,
    });
    expect(parts).toContainEqual({ type: "route", text: "contact.http", to: "/contact" });
    expect(parts.map((p) => p.text).join("")).not.toContain("**");
  });

  it("groups consecutive '- ' lines into a list", () => {
    expect(blocks("Intro\n- one\n- two\nOutro").map((b) => b.type)).toEqual([
      "paragraph",
      "list",
      "paragraph",
    ]);
  });

  it("knows every chunk, so source chips can find their file", () => {
    expect(chunkById.get("projects/agentguard.py#built")?.route).toBe("/projects/agentguard#built");
  });
});
