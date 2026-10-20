import type { Page } from "@playwright/test";
import { projects } from "../../src/content/projects";
import { expect, runFromPalette, test } from "./fixtures";

const palette = (page: Page) => page.getByRole("dialog", { name: "Command palette" });
const paletteInput = (page: Page) => palette(page).getByRole("combobox");
const tab = (page: Page, name: string) => page.getByRole("tab", { name, exact: true });
const menubar = (page: Page) => page.getByRole("menubar", { name: "Application menu" });
const sidebar = (page: Page) => page.getByRole("button", { name: "Explorer", exact: true });

async function runCommand(page: Page, title: string) {
  await page.keyboard.press("Control+Shift+P");
  await paletteInput(page).fill(`>${title}`);
  await palette(page).getByRole("option", { name: title }).first().click();
  await expect(palette(page)).toHaveCount(0);
}

async function openMenu(page: Page, label: string) {
  await menubar(page).getByRole("menuitem", { name: label, exact: true }).click();
  return page.getByRole("menu", { name: label });
}

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.describe("command palette", () => {
    test("Ctrl+P lists files and opens one; focus goes back on close", async ({ page }) => {
      await page.goto("/");
      const search = page.getByRole("button", { name: "Search files and commands" });
      await search.focus();
      await page.keyboard.press("Control+P");
      await expect(paletteInput(page)).toBeFocused();
      await expect(paletteInput(page)).toHaveValue("");
      await paletteInput(page).fill("chainlens");
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL("/projects/chainlens");
      await expect(tab(page, "chainlens.py")).toHaveAttribute("aria-selected", "true");

      await page.keyboard.press("Control+P");
      await page.keyboard.press("Escape");
      await expect(palette(page)).toHaveCount(0);
      await expect(search).toBeFocused();
    });

    test("the title bar search box opens it, and project names match too", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Search files and commands" }).click();
      await paletteInput(page).fill("LLM Gateway");
      await expect(palette(page).getByRole("option").first()).toContainText("llm_gateway.py");
    });

    test("recently opened files come first", async ({ page }) => {
      await page.goto("/about");
      await expect(tab(page, "about.py")).toBeVisible();
      await page.goto("/contact");
      await expect(tab(page, "contact.http")).toBeVisible();
      await page.keyboard.press("Control+P");
      const first = palette(page).getByRole("option").first();
      await expect(first).toContainText("contact.http");
      await expect(palette(page).getByRole("option").nth(1)).toContainText("about.py");
    });

    test("> lists commands with their shortcuts; Ctrl+Shift+P and F1 open it", async ({ page }) => {
      await page.goto("/");
      await page.keyboard.press("Control+Shift+P");
      await expect(paletteInput(page)).toHaveValue(">");
      await paletteInput(page).fill(">toggle terminal");
      const option = palette(page).getByRole("option", { name: /View: Toggle Terminal/ });
      await expect(option).toContainText("Ctrl+`");
      await expect(option).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("region", { name: "Panel" })).toBeVisible();

      await page.keyboard.press("F1");
      await expect(paletteInput(page)).toHaveValue(">");
      // Inside the palette, Ctrl+P switches to files.
      await page.keyboard.press("Control+P");
      await expect(paletteInput(page)).toHaveValue("");
    });

    test("Go to Project lists the projects folder", async ({ page }) => {
      await page.goto("/");
      await page.keyboard.press("Control+Shift+P");
      await runFromPalette(page, ">Go to Project", "Go to Project");
      await expect(paletteInput(page)).toHaveValue("projects/");
      await expect(palette(page).getByRole("option").first()).toContainText(".");
      const names = await palette(page).getByRole("option").allInnerTexts();
      expect(names.slice(0, projects.length).every((n) => n.includes("projects"))).toBe(true);
    });

    test("a live demo gets a command only when its last check passed", async ({ page }) => {
      await page.goto("/");
      await page.keyboard.press("Control+Shift+P");
      await paletteInput(page).fill(">live");
      for (const p of projects.filter((x) => x.links.live)) {
        const title = `Open ${p.name} live${p.archived ? " (archived)" : ""}`;
        await expect(palette(page).getByRole("option", { name: title })).toHaveCount(
          p.liveCheck?.ok ? 1 : 0,
        );
      }
    });

    test("theme commands switch the theme", async ({ page }) => {
      await page.goto("/");
      await runCommand(page, "Preferences: Color Theme: Daylight");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "daylight");
    });
  });

  test.describe("menus", () => {
    test("open with a click, move with arrows, close with Escape", async ({ page }) => {
      await page.goto("/");
      const view = await openMenu(page, "View");
      await expect(view).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await expect(view.getByRole("menuitem").first()).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("menu", { name: "Go" })).toBeVisible();
      await expect(
        page.getByRole("menu", { name: "Go" }).getByRole("menuitem").first(),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toHaveCount(0);
      await expect(menubar(page).getByRole("menuitem", { name: "Go" })).toBeFocused();
    });

    test("the keyboard opens a menu and activates an item", async ({ page }) => {
      await page.goto("/");
      await menubar(page).getByRole("menuitem", { name: "File" }).focus();
      await page.keyboard.press("ArrowRight"); // Edit
      await page.keyboard.press("ArrowRight"); // View
      await page.keyboard.press("Enter");
      const view = page.getByRole("menu", { name: "View" });
      await expect(view.getByRole("menuitem").first()).toBeFocused();
      await view.getByRole("menuitem", { name: /^Terminal/ }).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("menu")).toHaveCount(0);
      await expect(page.getByRole("region", { name: "Panel" })).toBeVisible();
    });

    test("clicking outside closes a menu", async ({ page }) => {
      await page.goto("/");
      await openMenu(page, "Help");
      await page.getByRole("main").click();
      await expect(page.getByRole("menu")).toHaveCount(0);
    });

    test("Open Recent lists the last files opened", async ({ page }) => {
      await page.goto("/about");
      await page.goto("/projects/agentguard");
      const file = await openMenu(page, "File");
      await file.getByRole("menuitem", { name: "Open Recent" }).hover();
      const recent = page.getByRole("menu", { name: "Open Recent" });
      await expect(recent.getByRole("menuitem").first()).toContainText("agentguard.py");
      await recent.getByRole("menuitem", { name: "about.py" }).click();
      await expect(page).toHaveURL("/about");
    });

    test("no item is dead: every one runs without errors", async ({ page, context }) => {
      // Help > View Source on GitHub opens a tab; keep it off the network.
      await context.route("https://github.com/**", (route) => route.fulfill({ body: "" }));
      await page.goto("/about");
      const labels = await menubar(page).getByRole("menuitem").allInnerTexts();
      expect(labels).toEqual(["File", "Edit", "View", "Go", "Terminal", "Help", "Assistant"]);
      for (const label of labels) {
        const count = await (
          await openMenu(page, label)
        )
          .locator(':scope > li > [role^="menuitem"]')
          .count();
        await page.keyboard.press("Escape");
        for (let i = 0; i < count; i++) {
          // Plain View leaves the workspace and Close All empties it: start again from a file.
          if (!(await menubar(page).count()) || !(await page.getByRole("tab").count()))
            await page.goto("/about");
          const menu = await openMenu(page, label);
          const item = menu.locator(':scope > li > [role^="menuitem"]').nth(i);
          if ((await item.getAttribute("aria-haspopup")) === "menu") {
            await item.hover();
            await page.getByRole("menu").last().getByRole("menuitem").first().click();
          } else {
            await item.click();
          }
          // Close whatever the item opened (palette, About, drawer) before the next one.
          await page.keyboard.press("Escape");
          await expect(page.getByRole("menu")).toHaveCount(0);
        }
      }
    });
  });

  test.describe("shortcuts", () => {
    test("Ctrl+B toggles the sidebar", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("navigation", { name: "Explorer" })).toBeVisible();
      await page.keyboard.press("Control+B");
      await expect(page.getByRole("navigation", { name: "Explorer" })).toHaveCount(0);
      await page.keyboard.press("Control+B");
      await expect(page.getByRole("navigation", { name: "Explorer" })).toBeVisible();
    });

    test("Ctrl+Shift+G and Ctrl+Shift+X open the git graph and extensions", async ({ page }) => {
      await page.goto("/");
      await expect(tab(page, "Welcome")).toBeVisible();
      await page.keyboard.press("Control+Shift+G");
      await expect(page).toHaveURL("/experience");
      await expect(page.getByRole("button", { name: "Source control" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.keyboard.press("Control+Shift+X");
      await expect(page).toHaveURL("/skills");
    });

    test("Alt+] and Alt+[ move between tabs, Alt+W closes one", async ({ page }) => {
      await page.goto("/");
      await page.goto("/about");
      await expect(tab(page, "about.py")).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("Alt+BracketRight");
      await expect(page).toHaveURL("/");
      await page.keyboard.press("Alt+BracketLeft");
      await expect(page).toHaveURL("/about");
      await page.keyboard.press("Alt+W");
      await expect(page.getByRole("tab")).toHaveCount(1);
      await expect(page).toHaveURL("/");
    });

    test("no shortcut fires while typing in a field", async ({ page }) => {
      await page.goto("/contact");
      await page.locator("#contact-name").click();
      await page.keyboard.press("Control+B");
      await page.keyboard.press("Alt+W");
      await expect(page.getByRole("navigation", { name: "Explorer" })).toBeVisible();
      await expect(tab(page, "contact.http")).toBeVisible();
    });
  });

  test.describe("view", () => {
    test("Zen mode hides the chrome and Escape leaves it", async ({ page }) => {
      await page.goto("/");
      await (
        await openMenu(page, "View")
      )
        .getByRole("menuitemcheckbox", { name: "Zen Mode" })
        .click();
      await expect(sidebar(page)).toHaveCount(0);
      await expect(page.getByRole("contentinfo", { name: "Status bar" })).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Explorer" })).toHaveCount(0);
      await page.getByRole("main").click();
      await page.keyboard.press("Escape");
      await expect(sidebar(page)).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Explorer" })).toBeVisible();
    });

    test("zoom scales the workspace and persists", async ({ page }) => {
      await page.goto("/");
      const shell = page.locator("#root > div").first();
      await (await openMenu(page, "View")).getByRole("menuitem", { name: "Zoom In" }).click();
      await expect(shell).toHaveCSS("zoom", "1.1");
      await page.reload();
      await expect(shell).toHaveCSS("zoom", "1.1");
      // The zoomed shell still fits the window exactly.
      const box = await page.getByRole("contentinfo", { name: "Status bar" }).boundingBox();
      expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(900);
      await (await openMenu(page, "View")).getByRole("menuitem", { name: "Reset Zoom" }).click();
      await expect(shell).toHaveCSS("zoom", "1");
    });

    test("Copy Link copies the file's URL and says so", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.goto("/projects/silentsos");
      await (
        await openMenu(page, "Edit")
      )
        .getByRole("menuitem", { name: "Copy Link to This File" })
        .click();
      await expect(page.getByRole("status")).toContainText("/projects/silentsos");
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      expect(copied).toMatch(/\/projects\/silentsos$/);
    });

    test("Help > About shows the version and closes with Escape", async ({ page }) => {
      await page.goto("/");
      await (await openMenu(page, "Help")).getByRole("menuitem", { name: "About" }).click();
      const about = page.getByRole("dialog", { name: "About" });
      await expect(about).toContainText("v2.0.0");
      await expect(about.getByRole("button", { name: "OK" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(about).toBeHidden();
    });
  });
});

test.describe("tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("the menus sit behind one button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("menubar")).toBeHidden();
    await page.getByRole("button", { name: "Application menu" }).click();
    const root = page.getByRole("menu", { name: "Application menu" });
    await root.getByRole("menuitem", { name: "Help" }).hover();
    await page
      .getByRole("menu", { name: "Help" })
      .getByRole("menuitem", { name: "Plain View" })
      .click();
    await expect(page).toHaveURL("/plain");
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("the top bar opens the palette, and views open in the drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Command palette" }).click();
    await expect(paletteInput(page)).toBeFocused();
    await runFromPalette(page, ">show extensions", "View: Show Extensions");
    await expect(page).toHaveURL("/skills");
  });
});
