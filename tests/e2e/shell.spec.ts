import type { Page } from "@playwright/test";
import { themes } from "../../src/themes/themes";
import { expect, test } from "./fixtures";

const explorer = (page: Page) => page.getByRole("navigation", { name: "Explorer" });
const tab = (page: Page, name: string) => page.getByRole("tab", { name, exact: true });
const statusBar = (page: Page) => page.getByRole("contentinfo", { name: "Status bar" });

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("opens Welcome on first load", async ({ page }) => {
    await page.goto("/");
    await expect(tab(page, "Welcome")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("explorer opens files as tabs, URLs follow, back and forward move between tabs", async ({
    page,
  }) => {
    await page.goto("/");
    await explorer(page).getByRole("link", { name: "agentguard.py" }).click();
    await expect(page).toHaveURL("/projects/agentguard");
    await expect(tab(page, "agentguard.py")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("navigation", { name: "Breadcrumbs" })).toContainText("projects");
    await expect(statusBar(page)).toContainText("Python");

    await explorer(page).getByRole("link", { name: "contact.http" }).click();
    await expect(page).toHaveURL("/contact");
    await expect(statusBar(page)).toContainText("HTTP");

    await page.goBack();
    await expect(page).toHaveURL("/projects/agentguard");
    await expect(tab(page, "agentguard.py")).toHaveAttribute("aria-selected", "true");
    await page.goForward();
    await expect(tab(page, "contact.http")).toHaveAttribute("aria-selected", "true");
  });

  test("closing the active tab moves to its neighbour, closing all shows an empty editor", async ({
    page,
  }) => {
    await page.goto("/");
    await explorer(page).getByRole("link", { name: "agentguard.py" }).click();
    await explorer(page).getByRole("link", { name: "about.py" }).click();
    await tab(page, "agentguard.py").click();

    await page.getByRole("button", { name: "Close agentguard.py" }).click();
    await expect(page).toHaveURL("/about");
    await expect(page.getByRole("tab")).toHaveCount(2);

    await tab(page, "Welcome").click({ button: "middle" });
    await expect(page.getByRole("tab")).toHaveCount(1);

    await page.getByRole("button", { name: "Close about.py" }).click();
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(page.getByText("No editor is open.")).toBeVisible();
    await page.getByRole("link", { name: "Open Welcome" }).click();
    await expect(tab(page, "Welcome")).toHaveAttribute("aria-selected", "true");
  });

  test("keyboard moves between tabs and Delete closes one", async ({ page }) => {
    await page.goto("/");
    await explorer(page).getByRole("link", { name: "about.py" }).click();
    await tab(page, "about.py").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL("/");
    await expect(tab(page, "Welcome")).toBeFocused();
    await page.keyboard.press("End");
    await expect(page).toHaveURL("/about");
    await expect(tab(page, "about.py")).toBeFocused();
    await page.keyboard.press("Delete");
    await expect(page.getByRole("tab")).toHaveCount(1);
  });

  test("archive is collapsed, and a deep link reveals an archived file", async ({ page }) => {
    await page.goto("/");
    await expect(explorer(page).getByRole("button", { name: "archive" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(explorer(page).getByRole("link", { name: "codemate.js" })).toHaveCount(0);

    await page.goto("/projects/codemate");
    await expect(explorer(page).getByRole("link", { name: "codemate.js" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("navigation", { name: "Breadcrumbs" })).toContainText("archive");
  });

  test("breadcrumb folders reveal the explorer", async ({ page }) => {
    await page.goto("/projects/agentguard");
    await page.getByRole("button", { name: "Explorer" }).click(); // hide the sidebar
    await expect(explorer(page)).toHaveCount(0);
    await page
      .getByRole("navigation", { name: "Breadcrumbs" })
      .getByRole("button", { name: "projects" })
      .click();
    await expect(explorer(page).getByRole("button", { name: "projects" })).toBeFocused();
  });

  test("open tabs survive a reload in the same session", async ({ page }) => {
    await page.goto("/");
    await explorer(page).getByRole("link", { name: "chainlens.py" }).click();
    await page.reload();
    await expect(page.getByRole("tab")).toHaveCount(2);
    await expect(tab(page, "chainlens.py")).toHaveAttribute("aria-selected", "true");
  });

  test("the problems item toggles the panel", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Problems/ }).click();
    const panel = page.getByRole("region", { name: "Panel" });
    await expect(panel.getByRole("tab", { name: "Problems" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.getByRole("button", { name: "Close panel" }).click();
    await expect(panel).toHaveCount(0);
  });

  test("unknown paths show a not-found editor", async ({ page }) => {
    await page.goto("/nope");
    await expect(page.getByRole("heading", { name: "Nothing lives at this path" })).toBeVisible();
  });

  test("the theme picker recolors the workspace and persists", async ({ page }) => {
    await page.goto("/");
    for (const theme of themes) {
      await statusBar(page)
        .getByRole("button", { name: /^Color theme/ })
        .click();
      await page.getByRole("dialog", { name: "Color theme" }).getByText(theme.label).click();
      await expect(page.getByRole("dialog", { name: "Color theme" })).toHaveCount(0);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme.id);
      const colors = await page.evaluate(() => {
        const css = getComputedStyle(document.documentElement);
        const bg = (el: Element | null) => (el ? getComputedStyle(el).backgroundColor : "");
        return {
          editor: css.getPropertyValue("--editor").trim(),
          statusbar: css.getPropertyValue("--statusbar").trim(),
          page: bg(document.querySelector("main")),
          footer: bg(document.querySelector("footer")),
        };
      });
      const hex = (rgb: string) =>
        "#" +
        (rgb.match(/\d+/g) ?? []).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
      expect(hex(colors.page)).toBe(colors.editor);
      expect(hex(colors.footer)).toBe(colors.statusbar);
    }
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", themes.at(-1)?.id ?? "");
  });

  test("defaults to Workspace Blue when the OS prefers dark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "workspace-blue");
  });

  test("a saved theme wins over the OS preference, before any app code runs", async ({ page }) => {
    // Serve an empty app bundle: whatever theme is set now came from the inline
    // script in <head>, which runs before first paint.
    await page.route("**/src/main.tsx", (route) =>
      route.fulfill({ contentType: "text/javascript", body: "" }),
    );
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "workspace-blue");
    await page.evaluate(() => localStorage.setItem("theme", "floodlight"));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "floodlight");
  });

  test("defaults to Daylight when the OS prefers light", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "light" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "daylight");
    await context.close();
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("uses a top bar and an explorer drawer instead of the activity bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Source control" })).toHaveCount(0);
    await page.getByRole("button", { name: "Open explorer" }).click();
    const drawer = page.getByRole("dialog", { name: "Explorer" });
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open explorer" })).toBeFocused();

    await page.getByRole("button", { name: "Open explorer" }).click();
    await drawer.getByRole("link", { name: "about.py" }).click();
    await expect(drawer).toHaveCount(0);
    await expect(page).toHaveURL("/about");
    await expect(tab(page, "about.py")).toHaveAttribute("aria-selected", "true");
  });
});
