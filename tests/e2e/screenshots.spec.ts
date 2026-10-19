import type { Page } from "@playwright/test";
import { themes, type ThemeId } from "../../src/themes/themes";
import { test } from "./fixtures";

const OUT = "screenshots/phase-3";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
] as const;

const PAGES = {
  welcome: "/",
  project: "/projects/agentguard",
  building: "/projects/llm-gateway",
  source: "/projects/agentguard?view=source",
  "git-graph": "/experience",
  extensions: "/skills",
  contact: "/contact",
  about: "/about",
  readme: "/readme",
  plain: "/plain",
} as const;

type PageName = keyof typeof PAGES;

/** Default theme: every page. The two themes furthest from it: the key pages. Others: Welcome. */
const MATRIX: Record<ThemeId, PageName[]> = {
  "workspace-blue": Object.keys(PAGES) as PageName[],
  daylight: ["welcome", "project", "source", "git-graph", "contact"],
  "high-contrast": ["welcome", "project", "source", "git-graph", "contact"],
  floodlight: ["welcome"],
  "solarized-dark": ["welcome"],
};

async function open(page: Page, theme: ThemeId, path: string) {
  await page.addInitScript((id) => localStorage.setItem("theme", id), theme);
  await page.goto(path);
  if (path.includes("view=source")) {
    await page.locator('pre[data-highlighted="true"]').waitFor();
  }
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of themes) {
  for (const name of MATRIX[theme.id]) {
    for (const viewport of VIEWPORTS) {
      test(`screenshots ${theme.id} ${name} ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await open(page, theme.id, PAGES[name]);
        await page.screenshot({ path: `${OUT}/${theme.id}-${name}-${viewport.name}.png` });
      });
    }
  }
}

test("screenshots default theme mobile, explorer drawer open", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, "workspace-blue", "/projects/agentguard");
  await page.getByRole("button", { name: "Open explorer" }).click();
  await page.screenshot({ path: `${OUT}/workspace-blue-drawer-mobile.png` });
});

test("screenshots default theme desktop, panel open on the git graph", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "workspace-blue", "/experience");
  await page.getByRole("button", { name: /^Problems/ }).click();
  await page.getByRole("tab", { name: "Terminal" }).click();
  await page.screenshot({ path: `${OUT}/workspace-blue-panel-desktop.png` });
});
