import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const settings = (page: Page) => page.getByRole("button", { name: "Settings" });
const shortcutList = (page: Page) =>
  page.getByRole("region", { name: "Keyboard shortcuts" }).locator("dl > div");
const paletteInput = (page: Page) =>
  page.getByRole("dialog", { name: "Command palette" }).getByRole("combobox");
const panel = (page: Page) => page.getByRole("region", { name: "Panel" });

/** "Ctrl+Shift+P" as shown, to Playwright's "Control+Shift+P". */
const toPlaywright = (shown: string) =>
  shown
    .split("+")
    .map(
      (k) =>
        ({ Ctrl: "Control", "`": "Backquote", "]": "BracketRight", "[": "BracketLeft" })[k] ?? k,
    )
    .join("+");

/**
 * What each listed shortcut must visibly do. A row without an entry here fails the test,
 * so a new shortcut can't be listed without proof that it works.
 */
const EFFECTS: Record<string, (page: Page) => Promise<void>> = {
  "Go to File...": async (page) => {
    await expect(paletteInput(page)).toHaveValue("");
    await page.keyboard.press("Escape");
  },
  "View: Command Palette": async (page) => {
    await expect(paletteInput(page)).toHaveValue(">");
    await page.keyboard.press("Escape");
  },
  "View: Show Search": async (page) => {
    await expect(page.getByRole("searchbox", { name: "Search" })).toBeFocused();
  },
  "View: Show Source Control": async (page) => {
    await expect(page).toHaveURL("/experience");
  },
  "View: Show Extensions": async (page) => {
    await expect(page).toHaveURL("/skills");
  },
  "View: Toggle Terminal": async (page) => {
    await expect(panel(page)).toBeVisible();
  },
  "View: Toggle Sidebar": async (page) => {
    await expect(page.getByRole("region", { name: "Keyboard shortcuts" })).toHaveCount(0);
  },
  "View: Close Editor": async (page) => {
    await expect(page.getByRole("tab")).toHaveCount(1);
  },
  "View: Open Next Editor": async (page) => {
    await expect(page).toHaveURL("/");
  },
  "View: Open Previous Editor": async (page) => {
    await expect(page).toHaveURL("/");
  },
};

/** A fresh session with two tabs (Welcome, about.py) and Settings open. */
async function openSettings(page: Page) {
  await page.goto("/");
  await page.evaluate(() => sessionStorage.clear());
  await page.goto("/");
  await page.goto("/about");
  await expect(page.getByRole("tab", { name: "about.py" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await settings(page).click();
}

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Help > Keyboard Shortcuts lands on the list, and every listed shortcut works", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/");
    await page.getByRole("menubar").getByRole("menuitem", { name: "Help" }).click();
    await page.getByRole("menuitem", { name: "Keyboard Shortcuts" }).click();
    await expect(page.getByRole("heading", { name: "Keyboard shortcuts" })).toBeFocused();

    const rows = await shortcutList(page).evaluateAll((divs) =>
      divs.map((d) => ({
        title: d.querySelector("dt")?.textContent ?? "",
        keys: [...d.querySelectorAll("kbd")].map((k) => k.textContent ?? ""),
      })),
    );
    // Every row but the last, Escape, which the menu, palette and Zen tests cover.
    const listed = rows.filter((r) => r.keys.join() !== "Esc");
    expect(listed.map((r) => r.title).sort()).toEqual(Object.keys(EFFECTS).sort());

    for (const row of listed) {
      for (const keys of row.keys) {
        await openSettings(page);
        await page.getByRole("main").click({ position: { x: 5, y: 5 } });
        await page.keyboard.press(toPlaywright(keys));
        await EFFECTS[row.title]?.(page);
      }
    }
  });

  test("zoom controls scale the workspace", async ({ page }) => {
    await openSettings(page);
    const zoom = page.getByRole("region", { name: "Zoom" });
    await expect(zoom.getByRole("button", { name: "Reset" })).toBeDisabled();
    await zoom.getByRole("button", { name: "Zoom in" }).click();
    await expect(zoom.getByLabel("Zoom level")).toHaveText("110%");
    await expect(page.locator("#root > div").first()).toHaveCSS("zoom", "1.1");
    await zoom.getByRole("button", { name: "Reset" }).click();
    await expect(zoom.getByLabel("Zoom level")).toHaveText("100%");
  });

  test("reduce motion can be forced on and persists", async ({ page }) => {
    await openSettings(page);
    const box = page.getByRole("checkbox", { name: "Reduce motion" });
    await expect(box).not.toBeChecked();
    await box.check();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  });

  test("an OS that asks for reduced motion is respected", async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto("/");
    await settings(page).click();
    const box = page.getByRole("checkbox", { name: "Reduce motion" });
    await expect(box).toBeChecked();
    await expect(box).toBeDisabled();
    await context.close();
  });

  test("the theme picker and build info are here", async ({ page }) => {
    await openSettings(page);
    await page.getByRole("group", { name: "Color theme" }).getByText("Daylight").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "daylight");
    const about = page.getByRole("region", { name: "About" });
    await expect(about).toContainText("v2.0.0");
    await expect(about).toContainText(/Commit\s*[0-9a-f]{7}/);
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("Settings opens in the drawer from the palette", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Command palette" }).click();
    await page.getByRole("combobox").fill(">open settings");
    await page.keyboard.press("Enter");
    const drawer = page.getByRole("dialog", { name: "Settings" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("group", { name: "Color theme" })).toBeVisible();
  });
});
