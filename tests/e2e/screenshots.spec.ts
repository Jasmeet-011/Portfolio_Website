import type { Page } from "@playwright/test";
import { themes } from "../../src/themes/themes";
import { test } from "./fixtures";

const OUT = "screenshots/phase-2";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
] as const;

/** Welcome, agentguard.py and contact.http open, agentguard.py active. */
async function openSampleTabs(page: Page, desktop: boolean) {
  await page.goto("/");
  if (desktop) {
    const explorer = page.getByRole("navigation", { name: "Explorer" });
    await explorer.getByRole("link", { name: "agentguard.py" }).click();
    await explorer.getByRole("link", { name: "contact.http" }).click();
    await page.getByRole("tab", { name: "agentguard.py" }).click();
  } else {
    await page.goto("/contact");
    await page.goto("/projects/agentguard");
  }
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of themes) {
  for (const viewport of VIEWPORTS) {
    test(`${theme.id} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((id) => localStorage.setItem("theme", id), theme.id);
      await openSampleTabs(page, viewport.name === "desktop");
      await page.screenshot({ path: `${OUT}/${theme.id}-${viewport.name}.png` });
    });
  }
}

test("floodlight desktop, panel and settings open", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSampleTabs(page, true);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: /^Problems/ }).click();
  await page.getByRole("tab", { name: "Terminal" }).click();
  await page.screenshot({ path: `${OUT}/floodlight-desktop-panel.png` });
});

test("floodlight desktop, 1280px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openSampleTabs(page, true);
  await page.screenshot({ path: `${OUT}/floodlight-1280.png` });
});

test("floodlight tablet, 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openSampleTabs(page, true);
  await page.screenshot({ path: `${OUT}/floodlight-tablet.png` });
});

test("floodlight mobile, explorer drawer open", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openSampleTabs(page, false);
  await page.getByRole("button", { name: "Open explorer" }).click();
  await page.screenshot({ path: `${OUT}/floodlight-mobile-drawer.png` });
});

test("floodlight mobile, theme picker open", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openSampleTabs(page, false);
  await page.getByRole("button", { name: /^Color theme/ }).click();
  await page.screenshot({ path: `${OUT}/floodlight-mobile-themes.png` });
});
