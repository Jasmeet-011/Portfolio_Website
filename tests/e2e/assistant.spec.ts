import type { Page, Route } from "@playwright/test";
import type { ErrorBody, StreamEvent, Trace } from "../../api/_lib/protocol";
import { links } from "../../src/content/links";
import { expect, runFromPalette, test } from "./fixtures";

/**
 * The assistant panel against a mocked /api/copilot: no test here ever reaches a
 * provider API. The API itself is covered by unit tests (api/_lib/handler.test.ts).
 */
const TRACE: Trace = {
  model: "gemini-3.5-flash-lite",
  effort: null,
  thinking: "minimal",
  contextVersion: "test",
  citedChunks: ["projects/agentguard.py#built", "projects/agentguard.py#results"],
  cachedAnswer: false,
  declined: false,
  inputTokens: 4200,
  outputTokens: 96,
  cacheReadTokens: 4100,
  cacheWriteTokens: 0,
  ttftMs: 420,
  totalMs: 1310,
};

const ANSWER: StreamEvent[] = [
  {
    type: "meta",
    quota: { limit: 10, remaining: 7, resetAt: Date.now() + 3_600_000 },
    cachedAnswer: false,
  },
  { type: "text", text: "Jasmeet built AgentGuard's retrieval:\n" },
  { type: "text", text: "- Hybrid dense and BM25 retrieval over 10 SEC Form ADV brochures.\n" },
  { type: "citation", chunkId: "projects/agentguard.py#built" },
  { type: "text", text: `- Results come with their caveat. Code: ${links.github}` },
  { type: "citation", chunkId: "projects/agentguard.py#results" },
  { type: "done", trace: TRACE },
];

const sse = (events: StreamEvent[]) => events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");

async function mock(page: Page, reply: (route: Route) => Promise<void>) {
  const bodies: unknown[] = [];
  await page.route("**/api/copilot", async (route) => {
    bodies.push(route.request().postDataJSON());
    await reply(route);
  });
  return bodies;
}

const answerWith = (events: StreamEvent[]) => (route: Route) =>
  route.fulfill({ status: 200, contentType: "text/event-stream", body: sse(events) });

const errorWith = (status: number, body: ErrorBody) => (route: Route) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

const panel = (page: Page) => page.getByRole("complementary", { name: "Assistant" });
const input = (page: Page) => panel(page).getByRole("textbox", { name: "Ask about Jasmeet" });

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("opens beside the editor with suggestions and the privacy note", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Assistant", exact: true }).click();
    await expect(panel(page)).toBeVisible();
    await expect(input(page)).toBeFocused();
    await expect(
      panel(page).getByRole("button", { name: "What is Jasmeet working on now?" }),
    ).toBeVisible();
    await expect(panel(page)).toContainText(
      "Questions are sent to Google's Gemini API free tier, and Google may use them to improve its products.",
    );
    await expect(panel(page)).toContainText(
      "Your questions are saved anonymously for 30 days to improve the assistant, with no IP address or identifier attached.",
    );
    // Beside the editor, not over it.
    const editor = await page.getByRole("main").boundingBox();
    const aside = await panel(page).boundingBox();
    expect((editor?.x ?? 0) + (editor?.width ?? 0)).toBeLessThanOrEqual((aside?.x ?? 0) + 1);
  });

  test("Ctrl+Alt+I toggles it, and the Assistant menu opens it", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("tab", { name: "Welcome" })).toBeVisible();
    await page.keyboard.press("Control+Alt+KeyI");
    await expect(panel(page)).toBeVisible();
    await page.getByRole("main").click();
    await page.keyboard.press("Control+Alt+KeyI");
    await expect(panel(page)).toHaveCount(0);
    await page.getByRole("menubar").getByRole("menuitem", { name: "Assistant" }).click();
    await page.getByRole("menuitem", { name: "Open Chat" }).click();
    await expect(panel(page)).toBeVisible();
  });

  test("a suggested question sends its id and shows a cited answer with source chips", async ({
    page,
  }) => {
    const bodies = await mock(page, answerWith(ANSWER));
    await page.goto("/");
    await page.getByRole("button", { name: "Assistant", exact: true }).click();
    await panel(page)
      .getByRole("button", { name: "What did Jasmeet build in AgentGuard?" })
      .click();
    await expect(panel(page)).toContainText("Hybrid dense and BM25 retrieval");
    expect(bodies[0]).toEqual({ chipId: "project-agentguard" });

    const sources = panel(page).getByRole("list", { name: "Sources" });
    await expect(sources.getByRole("link")).toHaveText([
      "agentguard.py › What I built",
      "agentguard.py › Results",
    ]);
    await expect(panel(page)).toContainText("7 of 10 questions left this hour");
    await expect(panel(page).getByRole("link", { name: links.github })).toBeVisible();

    await sources.getByRole("link", { name: "agentguard.py › What I built" }).click();
    await expect(page).toHaveURL("/projects/agentguard#built");
    await expect(page.getByRole("heading", { name: "What I built" })).toBeInViewport();
  });

  test("follow-up questions send the earlier exchange as history", async ({ page }) => {
    const bodies = await mock(page, answerWith(ANSWER));
    await page.goto("/");
    await page.getByRole("button", { name: "Assistant", exact: true }).click();
    await input(page).fill("What is AgentGuard?");
    await input(page).press("Enter");
    await expect(panel(page).getByRole("list", { name: "Sources" })).toBeVisible();
    await input(page).fill("And the results?");
    await input(page).press("Enter");
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]).toMatchObject({
      question: "And the results?",
      history: [
        { role: "user", text: "What is AgentGuard?" },
        { role: "assistant", text: expect.stringContaining("Hybrid dense") },
      ],
    });
  });

  test("a link the content doesn't contain is shown as text, not a link", async ({ page }) => {
    await mock(
      page,
      answerWith([
        { type: "meta", quota: null, cachedAnswer: false },
        { type: "text", text: "Log in at https://evil.example/login to see more." },
        { type: "done", trace: TRACE },
      ]),
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Assistant", exact: true }).click();
    await input(page).fill("Anything else?");
    await input(page).press("Enter");
    await expect(panel(page)).toContainText("https://evil.example/login");
    await expect(panel(page).getByRole("link", { name: /evil/ })).toHaveCount(0);
  });

  test("the hourly limit says when it resets, and the status bar shows it", async ({ page }) => {
    const resetAt = Date.now() + 25 * 60_000;
    await mock(
      page,
      errorWith(429, {
        code: "rate_limited",
        message: "You've reached this hour's limit of 10 questions.",
        resetAt,
        quota: { limit: 10, remaining: 0, resetAt },
      }),
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Assistant", exact: true }).click();
    await input(page).fill("One more?");
    await input(page).press("Enter");
    const notice = panel(page).getByRole("status");
    await expect(notice).toContainText(
      "You've reached this hour's limit of 10 questions. It resets at",
    );
    await expect(notice.getByRole("link", { name: "Plain view" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Assistant: rate limited" })).toBeVisible();
    await expect(panel(page)).toContainText("0 of 10 questions left this hour");
    await expect(panel(page).getByRole("button", { name: "Send" })).toBeDisabled();
  });

  test("the daily cap points to the files", async ({ page }) => {
    await mock(
      page,
      errorWith(429, {
        code: "daily_cap",
        message: "The assistant is done for today. Everything it knows is in these files.",
        resetAt: Date.now() + 3_600_000,
      }),
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Assistant", exact: true }).click();
    await input(page).fill("Hello?");
    await input(page).press("Enter");
    await expect(panel(page).getByRole("status")).toContainText("done for today");
    await expect(
      panel(page).getByRole("status").getByRole("link", { name: "README.md" }),
    ).toBeVisible();
  });

  test("Output > Assistant trace shows model, citations, tokens and timings", async ({ page }) => {
    await mock(page, answerWith(ANSWER));
    await page.goto("/");
    await page.getByRole("button", { name: "Assistant", exact: true }).click();
    await input(page).fill("What is AgentGuard?");
    await input(page).press("Enter");
    await expect(panel(page).getByRole("list", { name: "Sources" })).toBeVisible();

    await page.getByRole("menubar").getByRole("menuitem", { name: "Assistant" }).click();
    await page.getByRole("menuitem", { name: "Show Trace" }).click();
    const trace = page.getByRole("list", { name: "Assistant trace" });
    await expect(trace).toContainText('question: "What is AgentGuard?"');
    await expect(trace).toContainText("gemini-3.5-flash-lite");
    await expect(trace).toContainText("projects/agentguard.py#built");
    await expect(trace).toContainText("first words 420 ms");
    await expect(trace).toContainText("7 of 10 left this hour");
  });

  test("View > Output opens the Output tab", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("menubar").getByRole("menuitem", { name: "View" }).click();
    await page.getByRole("menuitem", { name: /^Output/ }).click();
    await expect(page.getByRole("tab", { name: "Output" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("combobox", { name: "Channel" })).toHaveValue("Assistant trace");
  });

  test("ask in the terminal streams the answer and its sources", async ({ page }) => {
    const bodies = await mock(page, answerWith(ANSWER));
    await page.goto("/");
    await expect(page.getByRole("tab", { name: "Welcome" })).toBeVisible();
    await page.keyboard.press("Control+Backquote");
    const terminal = page.getByRole("textbox", { name: "Terminal input" });
    await terminal.fill('ask "What did Jasmeet build in AgentGuard?"');
    await terminal.press("Enter");
    const output = page.getByRole("log", { name: "Terminal output" });
    await expect(output).toContainText("Hybrid dense and BM25 retrieval");
    await expect(output.getByRole("link", { name: "agentguard.py › What I built" })).toBeVisible();
    expect(bodies[0]).toEqual({ question: "What did Jasmeet build in AgentGuard?" });
  });
});

test.describe("tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("overlays the editor and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Assistant", exact: true }).click();
    await expect(panel(page)).toHaveCSS("position", "fixed");
    await page.keyboard.press("Escape");
    await expect(panel(page)).toHaveCount(0);
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("opens as a bottom sheet from the palette and answers", async ({ page }) => {
    await mock(page, answerWith(ANSWER));
    await page.goto("/");
    await page.getByRole("button", { name: "Command palette" }).click();
    await runFromPalette(page, ">toggle assistant", "View: Toggle Assistant");
    await expect(panel(page)).toBeVisible();
    const box = await panel(page).boundingBox();
    expect(box?.width).toBe(375);
    await panel(page).getByRole("button", { name: "What did Jasmeet build in AgentGuard?" }).tap();
    await expect(panel(page).getByRole("list", { name: "Sources" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel(page)).toHaveCount(0);
  });
});
