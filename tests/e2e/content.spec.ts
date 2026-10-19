import { expect, test } from "@playwright/test";
import * as education from "../../src/content/education";
import * as experience from "../../src/content/experience";
import * as links from "../../src/content/links";
import * as profile from "../../src/content/profile";
import { projects } from "../../src/content/projects";
import * as skills from "../../src/content/skills";
import { isTodo } from "../../src/content/todo";

/** Every string reachable from the content modules, with its path. */
function strings(value: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof value === "string") out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (value && typeof value === "object" && !isTodo(value))
    for (const [k, v] of Object.entries(value)) strings(v, `${path}.${k}`, out);
  return out;
}

test.describe("content rules", () => {
  test("project one-liners are under 20 words and carry no numbers", () => {
    for (const p of projects) {
      expect(p.oneLiner.split(/\s+/).length, p.slug).toBeLessThan(20);
      expect(p.oneLiner, p.slug).not.toMatch(/\d/);
    }
  });

  test("built bullets are first person", () => {
    for (const p of projects) {
      if (isTodo(p.built)) continue;
      for (const line of p.built) expect(line, p.slug).toMatch(/^I /);
    }
  });

  test("every featured building project is never archived, and every archived one is not featured", () => {
    for (const p of projects) expect(p.archived && p.featured, p.slug).toBe(false);
    expect(projects.filter((p) => p.featured && p.status === "building").length).toBeGreaterThan(0);
  });

  test("every skill has a category and a one-line description", () => {
    for (const s of skills.skills) {
      expect(s.category, s.name).not.toBe("Other");
      expect(s.description, s.name).toBeTruthy();
    }
  });

  test("no en or em dashes anywhere in content", () => {
    const all = strings({ education, experience, links, profile, projects, skills }, "content");
    for (const [path, text] of all) expect(text, path).not.toMatch(/[–—]/);
  });
});
