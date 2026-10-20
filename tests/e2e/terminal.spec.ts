import type { Page } from "@playwright/test";
import { degrees } from "../../src/content/education";
import { roles } from "../../src/content/experience";
import { links } from "../../src/content/links";
import { projects } from "../../src/content/projects";
import { expect, test } from "./fixtures";

const input = (page: Page) => page.getByRole("textbox", { name: "Terminal input" });
const output = (page: Page) => page.getByRole("log", { name: "Terminal output" });

async function openTerminal(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByRole("tab").first()).toBeVisible();
  await page.keyboard.press("Control+Backquote");
  await expect(input(page)).toBeFocused();
}

async function run(page: Page, command: string) {
  await input(page).fill(command);
  await input(page).press("Enter");
}

test.use({ viewport: { width: 1440, height: 900 } });

test("Ctrl+` opens the terminal focused, and closes it from inside", async ({ page }) => {
  await openTerminal(page);
  await expect(output(page)).toContainText("Type help to see what works here.");
  await page.keyboard.press("Control+Backquote");
  await expect(page.getByRole("region", { name: "Panel" })).toHaveCount(0);
});

test("help lists every command, and unknown ones get a hint", async ({ page }) => {
  await openTerminal(page);
  await run(page, "help");
  for (const name of [
    "help",
    "whoami",
    "ls",
    "open",
    "projects",
    "git log",
    "skills",
    "contact",
    "theme",
    "clear",
    "history",
    "exit",
  ])
    await expect(output(page)).toContainText(name);
  // resume appears only once public/resume.pdf exists; ask arrives in Phase 5.
  await expect(output(page)).not.toContainText("resume");
  await expect(output(page)).not.toContainText("ask");
  await run(page, "sudo rm -rf /");
  await expect(output(page)).toContainText("command not found: sudo. Try help.");
});

test("whoami, contact and skills print from content", async ({ page }) => {
  await openTerminal(page);
  await run(page, "whoami");
  await expect(output(page)).toContainText("Jasmeet Singh Wadhwa");
  await run(page, "contact");
  await expect(output(page)).toContainText(links.email);
  await expect(output(page).getByRole("link", { name: links.linkedin })).toBeVisible();
  await run(page, "skills");
  await expect(output(page)).toContainText("Languages");
});

test("git log prints the career, same data as the graph", async ({ page }) => {
  await openTerminal(page);
  await run(page, "git log");
  for (const r of roles) await expect(output(page)).toContainText(`${r.title} @ ${r.company}`);
  for (const d of degrees) await expect(output(page)).toContainText(`tag: ${d.slug}`);
  await expect(output(page)).toContainText("(HEAD -> main)");
  await output(page)
    .getByRole("link", { name: /Qualitest/ })
    .click();
  await expect(page).toHaveURL("/experience#qualitest-intern");
  await run(page, "git status");
  await expect(output(page)).toContainText('only "git log" works here');
});

test("projects lists every project with its status", async ({ page }) => {
  await openTerminal(page);
  await run(page, "projects");
  for (const p of projects) await expect(output(page)).toContainText(p.name);
  await expect(output(page)).toContainText("building on feat/llm-gateway");
  await expect(output(page)).toContainText("archived");
});

test("ls lists folders and files, open and cat open tabs", async ({ page }) => {
  await openTerminal(page);
  await run(page, "ls");
  await expect(output(page)).toContainText("projects/");
  await expect(output(page)).toContainText("about.py");
  await run(page, "ls projects/archive");
  await expect(output(page)).toContainText("codemate.js");
  await run(page, "ls nowhere");
  await expect(output(page)).toContainText("ls: cannot access 'nowhere'");

  await run(page, "open about.py");
  await expect(page).toHaveURL("/about");
  await expect(input(page)).toBeFocused();
  await run(page, "cat agentguard.py");
  await expect(page).toHaveURL("/projects/agentguard");
  await run(page, "open projects");
  await expect(output(page)).toContainText("open: projects: Is a directory");
  await run(page, "open");
  await expect(output(page)).toContainText("usage: open <file>");
});

test("Tab completes commands, files and themes", async ({ page }) => {
  await openTerminal(page);
  await input(page).fill("proj");
  await input(page).press("Tab");
  await expect(input(page)).toHaveValue("projects ");

  await input(page).fill("open agent");
  await input(page).press("Tab");
  await expect(input(page)).toHaveValue("open agentguard.py ");

  await input(page).fill("ls pro");
  await input(page).press("Tab");
  await expect(input(page)).toHaveValue("ls projects/");

  await input(page).fill("theme day");
  await input(page).press("Tab");
  await expect(input(page)).toHaveValue("theme daylight ");

  // Several matches with nothing in common to add: they are listed.
  await input(page).fill("c");
  await input(page).press("Tab");
  await expect(output(page)).toContainText("cat  clear  contact");
});

test("Tab on an empty line moves focus on, so the terminal never traps it", async ({ page }) => {
  await openTerminal(page);
  await input(page).press("Tab");
  await expect(input(page)).not.toBeFocused();
});

test("history walks with up and down; clear and exit work", async ({ page }) => {
  await openTerminal(page);
  await run(page, "whoami");
  await run(page, "ls");
  await input(page).press("ArrowUp");
  await expect(input(page)).toHaveValue("ls");
  await input(page).press("ArrowUp");
  await expect(input(page)).toHaveValue("whoami");
  await input(page).press("ArrowDown");
  await expect(input(page)).toHaveValue("ls");
  await input(page).press("ArrowDown");
  await expect(input(page)).toHaveValue("");

  await run(page, "history");
  await expect(output(page)).toContainText("1  whoami");
  await run(page, "clear");
  await expect(output(page)).toHaveText("");
  await run(page, "exit");
  await expect(page.getByRole("region", { name: "Panel" })).toHaveCount(0);
});

test("theme switches the theme", async ({ page }) => {
  await openTerminal(page);
  await run(page, "theme high-contrast");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "high-contrast");
  await run(page, "theme nope");
  await expect(output(page)).toContainText("theme: no theme named 'nope'");
});

test("Terminal > New Terminal starts a fresh session, Clear Terminal empties it", async ({
  page,
}) => {
  await openTerminal(page);
  await run(page, "whoami");
  await page.getByRole("menubar").getByRole("menuitem", { name: "Terminal" }).click();
  await page.getByRole("menuitem", { name: "Clear Terminal" }).click();
  await expect(output(page)).toHaveText("");
  await page.getByRole("menubar").getByRole("menuitem", { name: "Terminal" }).click();
  await page.getByRole("menuitem", { name: "New Terminal" }).click();
  await expect(output(page)).toHaveText("Type help to see what works here.");
  await expect(input(page)).toBeFocused();
});
