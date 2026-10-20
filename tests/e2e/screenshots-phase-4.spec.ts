import type { Page } from "@playwright/test";
import { expect, runFromPalette, test } from "./fixtures";

const OUT = "screenshots/phase-4";

const DESKTOP = { width: 1440, height: 900 };
const TABLET = { width: 1024, height: 768 };
const PHONE = { width: 375, height: 812 };

async function open(page: Page, path: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(path);
  await expect(page.getByRole("tab").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const shot = (page: Page, name: string) => page.screenshot({ path: `${OUT}/${name}.png` });

async function terminalWith(page: Page, commands: string[]) {
  const input = page.getByRole("textbox", { name: "Terminal input" });
  for (const c of commands) {
    await input.fill(c);
    await input.press("Enter");
  }
}

test.describe("screenshots phase 4", () => {
  test("screenshots palette desktop", async ({ page }) => {
    await open(page, "/projects/agentguard", DESKTOP);
    await page.keyboard.press("Control+P");
    await shot(page, "palette-files-desktop");
    await page.keyboard.press("Control+Shift+P");
    await shot(page, "palette-commands-desktop");
  });

  test("screenshots palette phone", async ({ page }) => {
    await open(page, "/", PHONE);
    await page.getByRole("button", { name: "Command palette" }).click();
    await page.getByRole("combobox").fill(">");
    await shot(page, "palette-commands-phone");
  });

  test("screenshots menu desktop", async ({ page }) => {
    // A few files opened first, so Open Recent has a history to show.
    for (const path of ["/projects/chainlens", "/readme", "/contact"])
      await open(page, path, DESKTOP);
    await open(page, "/about", DESKTOP);
    await page.getByRole("menubar").getByRole("menuitem", { name: "View" }).click();
    await shot(page, "menu-view-desktop");
    await page.keyboard.press("Escape");
    await page.getByRole("menubar").getByRole("menuitem", { name: "File" }).click();
    await page.getByRole("menuitem", { name: "Open Recent" }).hover();
    await shot(page, "menu-file-recent-desktop");
  });

  test("screenshots menu tablet", async ({ page }) => {
    await open(page, "/", TABLET);
    await page.getByRole("button", { name: "Application menu" }).click();
    await page
      .getByRole("menu", { name: "Application menu" })
      .getByRole("menuitem", { name: "Go" })
      .hover();
    await shot(page, "menu-compact-tablet");
  });

  for (const [name, viewport] of [
    ["desktop", DESKTOP],
    ["phone", PHONE],
  ] as const) {
    test(`screenshots terminal ${name}`, async ({ page }) => {
      await open(page, "/", viewport);
      if (name === "desktop") await page.keyboard.press("Control+Backquote");
      else {
        await page.getByRole("button", { name: "Command palette" }).click();
        await runFromPalette(page, ">toggle terminal", "View: Toggle Terminal");
      }
      await terminalWith(page, ["help", "git log"]);
      await shot(page, `terminal-${name}`);
    });

    test(`screenshots settings ${name}`, async ({ page }) => {
      await open(page, "/", viewport);
      if (name === "desktop") await page.getByRole("button", { name: "Settings" }).click();
      else {
        await page.getByRole("button", { name: "Command palette" }).click();
        await runFromPalette(page, ">open settings", "Preferences: Open Settings");
      }
      await shot(page, `settings-${name}`);
    });

    test(`screenshots search ${name}`, async ({ page }) => {
      await open(page, "/", viewport);
      if (name === "desktop") await page.keyboard.press("Control+Shift+F");
      else {
        await page.getByRole("button", { name: "Command palette" }).click();
        await runFromPalette(page, ">find in workspace", "Search: Find in Workspace");
      }
      await page.getByRole("searchbox", { name: "Search" }).fill("retrieval");
      await shot(page, `search-results-${name}`);
      if (name === "desktop") {
        // A picked result: the file opens with every match highlighted.
        await page
          .getByRole("list", { name: "Search results" })
          .getByRole("listitem")
          .filter({ hasText: "agentguard.py" })
          .getByRole("link")
          .first()
          .click();
        await expect
          .poll(() => page.evaluate(() => CSS.highlights.get("search")?.size ?? 0))
          .toBeGreaterThan(0);
        await shot(page, "search-match-desktop");
      }
    });
  }
});
