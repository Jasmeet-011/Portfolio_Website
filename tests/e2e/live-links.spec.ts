import { projects } from "../../src/content/projects";
import { expect, test } from "./fixtures";

const hidden = projects.filter((p) => p.links.live && !p.liveCheck?.ok);
const shown = projects.filter((p) => p.links.live && p.liveCheck?.ok);

test.use({ viewport: { width: 1440, height: 900 } });

test("a live app whose check failed is linked nowhere", async ({ page }) => {
  // Fifteen pages, each Source view waiting on Shiki: same budget as the coverage test.
  test.setTimeout(120_000);
  expect(hidden.length + shown.length).toBeGreaterThan(0);
  const pages = [
    "/plain",
    ...projects.flatMap((p) => [`/projects/${p.slug}`, `/projects/${p.slug}?view=source`]),
  ];
  for (const path of pages) {
    await page.goto(path);
    if (path.includes("view=source"))
      await expect(page.getByLabel("Source", { exact: true })).toHaveAttribute(
        "data-highlighted",
        "true",
      );
    const html = await page.locator("body").innerHTML();
    for (const p of hidden) expect(html, `${p.links.live} on ${path}`).not.toContain(p.links.live);
  }
});

test("a project page with no passing check has no Live app link", async ({ page }) => {
  for (const p of hidden) {
    await page.goto(`/projects/${p.slug}`);
    await expect(page.getByRole("link", { name: /Code on GitHub/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Live app/ })).toHaveCount(0);
  }
});

test("the panel has Terminal, Problems and Output, and no placeholder text", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Problems/ }).click();
  const panel = page.getByRole("region", { name: "Panel" });
  await expect(panel.getByRole("tab")).toHaveText(["Terminal", "Problems", "Output"]);
  await expect(page.getByText(/arrive in Phase 5/)).toHaveCount(0);
});
