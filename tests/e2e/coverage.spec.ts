import * as education from "../../src/content/education";
import * as experience from "../../src/content/experience";
import * as links from "../../src/content/links";
import * as profile from "../../src/content/profile";
import { projects } from "../../src/content/projects";
import * as skills from "../../src/content/skills";
import { isTodo } from "../../src/content/todo";
import { formatMonth } from "../../src/lib/dates";
import { shownLinks } from "../../src/lib/projects";
import { expect, test } from "./fixtures";

/**
 * plan.md Phase 3, done when: every piece of content in src/content is visible
 * somewhere. Collects every string that is not a Todo and looks for it across the site.
 */

// Internal identifiers, not copy: used in URLs and ids rather than shown as text.
// liveCheck is maintenance data that decides whether a live demo gets a palette command.
const INTERNAL_KEYS = new Set(["slug", "kind", "liveCheck"]);

function strings(value: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof value === "string") out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (value && typeof value === "object" && !isTodo(value))
    for (const [k, v] of Object.entries(value))
      if (!INTERNAL_KEYS.has(k)) strings(v, `${path}.${k}`, out);
  return out;
}

const PAGES = [
  "/",
  "/plain",
  "/readme",
  "/about",
  "/experience",
  "/skills",
  "/contact",
  ...projects.flatMap((p) => [`/projects/${p.slug}`, `/projects/${p.slug}?view=source`]),
];

test.use({ viewport: { width: 1440, height: 900 } });

test("every piece of content is visible somewhere on the site", async ({ page }) => {
  test.setTimeout(120_000);
  const texts: string[] = [];
  for (const path of PAGES) {
    await page.goto(path);
    if (path.includes("view=source")) {
      await expect(page.getByLabel("Source", { exact: true })).toHaveAttribute(
        "data-highlighted",
        "true",
      );
    }
    texts.push(await page.locator("body").innerText());
    // Link targets count as visible for URLs (shown as links, not always as text).
    texts.push(
      ...(await page
        .locator("a[href]")
        .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""))),
    );
  }
  const site = texts.join("\n").replace(/\s+/g, " ");
  const content = strings(
    {
      education,
      experience,
      links,
      profile,
      // A live app whose check failed is hidden on purpose (plan.md Decisions log).
      projects: projects.map((p) => ({ ...p, links: shownLinks(p) })),
      skills: skills.skills,
    },
    "content",
  );
  const missing = content
    .filter(([, text]) => text.trim() !== "")
    // Dates are shown formatted: "2024-08" appears as "Aug 2024".
    .map(([path, text]): [string, string] => [
      path,
      /^\d{4}-\d{2}$/.test(text) ? formatMonth(text) : text,
    ])
    .filter(([, text]) => !site.includes(text.replace(/\s+/g, " ")))
    .map(([path, text]) => `${path}: ${text}`);
  expect(missing, "content not visible anywhere").toEqual([]);
});
