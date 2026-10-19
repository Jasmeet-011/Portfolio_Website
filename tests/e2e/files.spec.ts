import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.use({ viewport: { width: 1440, height: 900 } });

const editor = (page: Page) => page.locator("#editor-panel");

test.describe("README.md and about.py", () => {
  test("README previews the workspace, stack and links", async ({ page }) => {
    await page.goto("/readme");
    await expect(editor(page).getByRole("heading", { level: 1 })).toHaveText("jasmeet-wadhwa");
    await expect(editor(page)).toContainText(
      "AI engineer focused on AI and agentic backend systems.",
    );
    await expect(editor(page)).toContainText("Languages: Python");
    await expect(editor(page).getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/Jasmeet-011",
    );
  });

  test("the Source toggle shows highlighted source and keeps the mode in the URL", async ({
    page,
  }) => {
    await page.goto("/about");
    await expect(editor(page)).toContainText("Research Engineer, NYU, Prof. Dennis Shasha");
    await page.getByRole("button", { name: "Source", exact: true }).click();
    await expect(page).toHaveURL("/about?view=source");
    const source = page.getByLabel("Source", { exact: true });
    await expect(source).toHaveAttribute("data-highlighted", "true");
    await expect(source).toContainText('name = "Jasmeet Singh Wadhwa"');
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(page).toHaveURL("/about");
  });

  test("a source view deep link opens in Source mode", async ({ page }) => {
    await page.goto("/readme?view=source");
    await expect(page.getByRole("button", { name: "Source", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByLabel("Source", { exact: true })).toContainText("# jasmeet-wadhwa");
  });

  test("about.py shows education, certification and publication with links", async ({ page }) => {
    await page.goto("/about");
    await expect(editor(page)).toContainText("MS Computer Science");
    await expect(editor(page)).toContainText("GPA 9.8/10");
    await expect(
      editor(page).getByRole("link", { name: /AWS Certified Solutions Architect, Associate/ }),
    ).toHaveAttribute("href", /credly\.com/);
    await expect(
      editor(page).getByRole("link", { name: /Hybrid Gradient Boosting Algorithm/ }),
    ).toHaveAttribute("href", /ieeexplore/);
  });
});
