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

test.describe("project files", () => {
  test("a shipped project shows problem, what I built, results and stack", async ({ page }) => {
    await page.goto("/projects/agentguard");
    await expect(editor(page).getByRole("heading", { level: 1 })).toHaveText("AgentGuard");
    await expect(editor(page)).toContainText("shipped");
    for (const heading of ["Problem", "What I built", "Results", "Stack"]) {
      await expect(editor(page).getByRole("heading", { name: heading })).toBeVisible();
    }
    await expect(editor(page)).toContainText("read this as an anecdote, not a benchmark");
    await expect(editor(page).getByRole("link", { name: "Claude", exact: true })).toHaveAttribute(
      "href",
      "/skills#claude",
    );
  });

  test("a building project says so and shows its feature branch", async ({ page }) => {
    await page.goto("/projects/llm-gateway");
    await expect(editor(page)).toContainText("building");
    await expect(editor(page)).toContainText("feat/llm-gateway is still being built");
    await expect(editor(page).getByRole("heading", { name: "Results" })).toBeVisible();
  });

  test("an archived project is marked archived", async ({ page }) => {
    await page.goto("/projects/codemate");
    await expect(editor(page)).toContainText("Archived. Kept here for the record.");
    await expect(editor(page).getByRole("link", { name: /Live app/ })).toHaveAttribute(
      "href",
      "https://codemate-taupe.vercel.app",
    );
  });

  test("Todo fields never render", async ({ page }) => {
    for (const slug of ["chainlens", "reposcope", "synapsemeet"]) {
      await page.goto(`/projects/${slug}`);
      await expect(editor(page)).not.toContainText("TODO");
      await page.goto(`/projects/${slug}?view=source`);
      await expect(page.getByLabel("Source", { exact: true })).not.toContainText("TODO");
    }
  });

  test("source is written in the project's language", async ({ page }) => {
    await page.goto("/projects/agentguard?view=source");
    await expect(page.getByLabel("Source", { exact: true })).toContainText("agentguard = Project(");
    await page.goto("/projects/silentsos?view=source");
    await expect(page.getByLabel("Source", { exact: true })).toContainText(
      "export const silentsos = {",
    );
    await page.goto("/projects/codemate?view=source");
    await expect(page.getByLabel("Source", { exact: true })).toContainText(
      "export const codemate = {",
    );
  });
});

test.describe("git graph and source control", () => {
  test("every role is a commit with its message, dates and summary", async ({ page }) => {
    await page.goto("/experience");
    for (const message of [
      "Research Engineer @ NYU, Prof. Dennis Shasha",
      "Teaching Assistant, Object-Oriented Programming @ NYU Tandon",
      "Software Engineer Intern @ Qualitest",
    ]) {
      await expect(editor(page)).toContainText(message);
    }
    await expect(editor(page)).toContainText("Aug 2026 to Present, research");
    await expect(editor(page)).toContainText("tag: ms-cs-nyu");
    await expect(editor(page)).toContainText("AWS Certified Solutions Architect, Associate");
  });

  test("opening the Git Graph shows the source control view, and commits link to rows", async ({
    page,
  }) => {
    await page.goto("/experience");
    const scm = page.getByRole("navigation", { name: "Source control" });
    await expect(scm).toBeVisible();
    await scm.getByRole("link", { name: /Software Engineer Intern @ Qualitest/ }).click();
    await expect(page).toHaveURL("/experience#qualitest-intern");
    await expect(page.locator("#qualitest-intern")).toBeInViewport();
  });

  test("a stack chip on a role opens the skill in Extensions", async ({ page }) => {
    await page.goto("/experience");
    await editor(page).getByRole("link", { name: "SQLite", exact: true }).click();
    await expect(page).toHaveURL("/skills#sqlite");
  });
});

test.describe("extensions", () => {
  test("every skill shows its description and where it was used", async ({ page }) => {
    await page.goto("/skills");
    await expect(editor(page)).toContainText("28 installed");
    const fastapi = page.locator("#fastapi");
    await expect(fastapi).toContainText("A Python web framework for building typed HTTP APIs.");
    await expect(fastapi.getByRole("link", { name: "ChainLens" })).toHaveAttribute(
      "href",
      "/projects/chainlens",
    );
    await expect(
      fastapi.getByRole("link", { name: "Software Engineer Intern, Qualitest" }),
    ).toHaveAttribute("href", "/experience#qualitest-intern");
  });

  test("project languages count as skills", async ({ page }) => {
    await page.goto("/skills");
    await expect(
      page.locator("#typescript").getByRole("link", { name: "SilentSOS" }),
    ).toBeVisible();
    await expect(
      page.locator("#javascript").getByRole("link", { name: "RepoScope" }),
    ).toBeVisible();
  });

  test("the sidebar lists installed extensions and opens one", async ({ page }) => {
    await page.goto("/skills");
    const view = page.getByRole("navigation", { name: "Extensions" });
    await view.getByRole("link", { name: /^Celery/ }).click();
    await expect(page).toHaveURL("/skills#celery");
    await expect(page.locator("#celery")).toBeInViewport();
  });
});
