import type { Page } from "@playwright/test";
import { projects } from "../../src/content/projects";
import { expect, runFromPalette, test } from "./fixtures";

const searchBox = (page: Page) => page.getByRole("searchbox", { name: "Search" });
const results = (page: Page) => page.getByRole("list", { name: "Search results" });

/** Number of ranges in the editor's search highlight. */
const highlighted = (page: Page) => page.evaluate(() => CSS.highlights.get("search")?.size ?? 0);

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Ctrl+Shift+F opens Search focused; results are grouped by file", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("tab", { name: "Welcome" })).toBeVisible();
    await page.keyboard.press("Control+Shift+F");
    await expect(searchBox(page)).toBeFocused();
    await expect(page.getByRole("status").first()).toContainText("Search every file");

    await searchBox(page).fill("fastapi");
    await expect(page.locator("#search-summary")).toHaveText(/\d+ results in \d+ files/);
    for (const file of ["chainlens.py", "synapsemeet.py", "Git Graph", "Extensions"])
      await expect(results(page)).toContainText(file);

    // A result in a view's tab (Extensions) leaves the results open.
    await results(page)
      .getByRole("listitem")
      .filter({ hasText: "Extensions" })
      .getByRole("link")
      .first()
      .click();
    await expect(page).toHaveURL("/skills");
    await expect(searchBox(page)).toBeVisible();
  });

  test("a result opens the file, highlights the matches and scrolls to the one picked", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await searchBox(page).fill("held-out");
    await results(page).getByRole("link").first().click();
    await expect(page).toHaveURL("/projects/agentguard");
    await expect.poll(() => highlighted(page)).toBeGreaterThan(0);
    const bullet = page.getByRole("main").getByText(/Held-out test split/);
    await expect(bullet).toBeInViewport();

    // Leaving through a tab clears the highlight.
    await page.getByRole("tab", { name: "Welcome" }).click();
    await expect.poll(() => highlighted(page)).toBe(0);
  });

  test("a match in Source view opens the readable Preview", async ({ page }) => {
    await page.goto("/projects/chainlens?view=source");
    await page.keyboard.press("Control+Shift+F");
    await searchBox(page).fill("Aptos and Solana");
    await results(page).getByRole("link").first().click();
    await expect(page).toHaveURL("/projects/chainlens");
    await expect(page.getByRole("button", { name: "Preview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("every project can be found by its one-liner", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    for (const p of projects) {
      await searchBox(page).fill(p.oneLiner.slice(0, 30));
      await expect(results(page)).toContainText(p.fileName);
    }
  });

  test("short and unknown queries say so", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await searchBox(page).fill("a");
    await expect(page.locator("#search-summary")).toHaveText("Search every file in the workspace.");
    await searchBox(page).fill("zzzzqx");
    await expect(page.locator("#search-summary")).toHaveText("No results.");
  });

  test("the query survives switching views; Find in Workspace focuses it", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await searchBox(page).fill("Qdrant");
    await page.getByRole("button", { name: "Explorer", exact: true }).click();
    await page.getByRole("menubar").getByRole("menuitem", { name: "Edit" }).click();
    await page.getByRole("menuitem", { name: "Find in Workspace" }).click();
    await expect(searchBox(page)).toBeFocused();
    await expect(searchBox(page)).toHaveValue("Qdrant");
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("Search opens in the drawer and a result closes it", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Command palette" }).click();
    await runFromPalette(page, ">find in workspace", "Search: Find in Workspace");
    const drawer = page.getByRole("dialog", { name: "Search" });
    await expect(drawer).toBeVisible();
    await expect(searchBox(page)).toBeFocused();
    await searchBox(page).fill("Twilio");
    await results(page)
      .getByRole("listitem")
      .filter({ hasText: "silentsos.ts" })
      .getByRole("link")
      .first()
      .click();
    await expect(drawer).toHaveCount(0);
    await expect(page).toHaveURL("/projects/silentsos");
  });
});
