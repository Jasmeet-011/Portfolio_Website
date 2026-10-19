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

test.describe("contact.http", () => {
  const fill = async (page: Page) => {
    await page.getByLabel('"name":').fill("Ada Lovelace");
    await page.getByLabel('"email":').fill("ada@example.com");
    await page.getByLabel('"message":').fill("Hello from a test.");
  };

  test("a successful request shows the real status and clears the form", async ({ page }) => {
    let body: unknown;
    await page.route("https://formspree.io/f/mzdarpdv", async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.goto("/contact");
    await fill(page);
    await page.getByRole("button", { name: "Send request" }).click();
    const response = page.getByRole("region", { name: "Response" });
    await expect(response).toContainText("HTTP/1.1 200 OK");
    await expect(response).toContainText('"ok": true');
    await expect(page.getByLabel('"name":')).toHaveValue("");
    expect(body).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Hello from a test.",
      _gotcha: "",
    });
  });

  test("an error response is shown as it came back", async ({ page }) => {
    await page.route("https://formspree.io/f/mzdarpdv", (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: '{"errors":[{"field":"email","message":"should be an email"}]}',
      }),
    );
    await page.goto("/contact");
    await fill(page);
    await page.getByRole("button", { name: "Send request" }).click();
    const response = page.getByRole("region", { name: "Response" });
    await expect(response).toContainText("HTTP/1.1 422 Unprocessable Entity");
    await expect(response).toContainText("should be an email");
    await expect(page.getByLabel('"name":')).toHaveValue("Ada Lovelace");
  });

  test("required fields stop an empty request", async ({ page }) => {
    let sent = false;
    await page.route("https://formspree.io/f/mzdarpdv", async (route) => {
      sent = true;
      await route.fulfill({ status: 200, body: "{}" });
    });
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByRole("region", { name: "Response" })).toContainText(
      "Send the request to see the response here.",
    );
    expect(sent).toBe(false);
  });

  test("the source view is the request with what was typed", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel('"name":').fill("Ada");
    await page.getByRole("button", { name: "Source", exact: true }).click();
    const source = page.getByLabel("Source", { exact: true });
    await expect(source).toContainText("POST https://formspree.io/f/mzdarpdv");
    await expect(source).toContainText('"name": "Ada"');
  });
});

test.describe("plain view", () => {
  test("has every role, project, degree, certification, publication and skill group", async ({
    page,
  }) => {
    await page.goto("/plain");
    const main = page.getByRole("main");
    for (const text of [
      "Research Engineer, NYU, Prof. Dennis Shasha",
      "Teaching Assistant, Object-Oriented Programming, NYU Tandon",
      "Software Engineer Intern, Qualitest",
      "AgentGuard",
      "ChainLens",
      "SilentSOS",
      "LLM Gateway (in progress, feat/llm-gateway)",
      "SynapseMeet (in progress, feat/synapsemeet)",
      "RepoScope (archived)",
      "CodeMate (archived)",
      "MS Computer Science",
      "BE Computer Science",
      "AWS Certified Solutions Architect, Associate",
      "A Hybrid Gradient Boosting Algorithm for Dynamic Pricing using a Custom Dataset",
      "AI and retrieval",
    ]) {
      await expect(main).toContainText(text);
    }
    await expect(page.locator("body")).not.toContainText("TODO");
  });

  test("the status bar opens it and it links back to the workspace", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("link", { name: "Plain view" }).click();
    await expect(page).toHaveURL("/plain");
    await page.getByRole("link", { name: "Back to the workspace" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("tab", { name: "Welcome" })).toBeVisible();
  });

  test("prints black on white whatever the theme", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "workspace-blue"));
    await page.goto("/plain");
    await page.emulateMedia({ media: "print" });
    const colors = await page.evaluate(() => {
      const style = (selector: string) => {
        const el = document.querySelector(selector);
        return el ? getComputedStyle(el) : null;
      };
      return {
        background: style("body > div div")?.backgroundColor,
        text: style("h1")?.color,
        link: style("main a")?.color,
      };
    });
    expect(colors).toEqual({
      background: "rgb(255, 255, 255)",
      text: "rgb(0, 0, 0)",
      link: "rgb(0, 0, 0)",
    });
    await expect(page.getByRole("link", { name: "Back to the workspace" })).toBeHidden();
  });
});

test.describe("welcome", () => {
  test("introduces Jasmeet, features shipped work and keeps building work separate", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(editor(page).getByRole("heading", { level: 1 })).toHaveText(
      "Jasmeet Singh Wadhwa",
    );
    await expect(editor(page)).toContainText(
      "// AI engineer focused on AI and agentic backend systems",
    );
    await expect(editor(page)).toContainText("Research Engineer, NYU, Prof. Dennis Shasha");

    const featured = editor(page).getByRole("region", { name: "Featured" });
    await expect(featured.getByRole("link")).toHaveText([/AgentGuard/, /ChainLens/, /SilentSOS/]);

    const building = editor(page).getByRole("region", { name: "Currently building" });
    await expect(building).toContainText("feat/llm-gateway");
    await expect(building).toContainText("building");
    await expect(building.getByRole("link", { name: "LLM Gateway" })).toHaveAttribute(
      "href",
      "/projects/llm-gateway",
    );

    for (const archived of ["RepoScope", "CodeMate"]) {
      await expect(editor(page)).not.toContainText(archived);
    }
  });

  test("Open projects reveals the projects folder in the explorer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Explorer" }).click(); // hide the sidebar
    await editor(page)
      .getByRole("button", { name: /Open projects/ })
      .click();
    await expect(
      page.getByRole("navigation", { name: "Explorer" }).getByRole("button", { name: "projects" }),
    ).toBeFocused();
  });

  test("every Start action goes somewhere real", async ({ page }) => {
    await page.goto("/");
    for (const [name, url] of [
      [/About me/, "/about"],
      [/Career history/, "/experience"],
      [/Send a message/, "/contact"],
      [/Plain view/, "/plain"],
    ] as const) {
      await page.goto("/");
      await editor(page).getByRole("link", { name }).click();
      await expect(page).toHaveURL(url);
    }
  });
});

test.describe("welcome on a phone", () => {
  test.use({ viewport: { width: 320, height: 700 }, hasTouch: true });

  test("the name stays on one line and the plain view is one tap away", async ({ page }) => {
    await page.goto("/");
    const name = editor(page).getByRole("heading", { level: 1 });
    const box = await name.boundingBox();
    const lineHeight = await name.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
    expect(box?.height ?? 0).toBeLessThan(lineHeight * 1.5);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
    await editor(page).getByRole("link", { name: "Read the plain view" }).click();
    await expect(page).toHaveURL("/plain");
  });
});
