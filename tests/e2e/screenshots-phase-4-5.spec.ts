import type { Page } from "@playwright/test";
import { expect, runFromPalette, test } from "./fixtures";

const OUT = "screenshots/phase-4.5";
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 375, height: 812 };

async function open(page: Page, path: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(path);
  await expect(page.getByRole("tab").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function openTerminal(page: Page, phone: boolean) {
  if (phone) {
    await page.getByRole("button", { name: "Command palette" }).click();
    await runFromPalette(page, ">toggle terminal", "View: Toggle Terminal");
  } else await page.keyboard.press("Control+Backquote");
}

async function type(page: Page, commands: string[]) {
  const input = page.getByRole("textbox", { name: "Terminal input" });
  for (const c of commands) {
    await input.fill(c);
    await input.press("Enter");
  }
}

test.describe("screenshots phase 4.5", () => {
  test("screenshots welcome desktop", async ({ page }) => {
    await open(page, "/", DESKTOP);
    await page.screenshot({ path: `${OUT}/welcome-desktop.png` });
  });

  test("screenshots welcome phone", async ({ page }) => {
    await open(page, "/", PHONE);
    await page.screenshot({ path: `${OUT}/welcome-phone.png`, fullPage: true });
  });

  test.describe("close-up", () => {
    test.use({ deviceScaleFactor: 2 });
    test("screenshots title bar", async ({ page }) => {
      await open(page, "/", DESKTOP);
      await page.screenshot({
        path: `${OUT}/titlebar-closeup.png`,
        clip: { x: 0, y: 0, width: 560, height: 40 },
      });
    });
  });

  for (const [name, viewport] of [
    ["desktop", DESKTOP],
    ["phone", PHONE],
  ] as const) {
    test(`screenshots terminal ${name}`, async ({ page }) => {
      await open(page, "/", viewport);
      await openTerminal(page, name === "phone");
      await type(page, ["neofetch"]);
      await page.screenshot({ path: `${OUT}/terminal-neofetch-${name}.png` });
      await type(page, ["clear", "help"]);
      await page.screenshot({ path: `${OUT}/terminal-help-${name}.png` });
    });
  }
});
