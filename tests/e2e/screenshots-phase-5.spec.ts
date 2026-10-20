import type { Page } from "@playwright/test";
import type { ErrorBody, StreamEvent } from "../../api/_lib/protocol";
import { projects } from "../../src/content/projects";
import { expect, test } from "./fixtures";

/**
 * Phase 5 screenshots. /api/copilot is mocked so they are reproducible and free; the
 * mocked answer is assembled from AgentGuard's own content, cited to the real sections.
 */
const OUT = "screenshots/phase-5";
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 375, height: 812 };

const agentguard = projects.find((p) => p.slug === "agentguard");
const built = Array.isArray(agentguard?.built) ? agentguard.built : [];
const results = Array.isArray(agentguard?.results) ? agentguard.results : [];

const ANSWER: StreamEvent[] = [
  {
    type: "meta",
    quota: { limit: 10, remaining: 8, resetAt: Date.now() + 40 * 60_000 },
    cachedAnswer: false,
  },
  { type: "text", text: "In AgentGuard, Jasmeet:\n" },
  { type: "text", text: `- ${built[0]?.replace(/^I /, "") ?? ""}\n` },
  { type: "text", text: `- ${built[1]?.replace(/^I /, "") ?? ""}\n` },
  { type: "citation", chunkId: "projects/agentguard.py#built" },
  { type: "text", text: `Results come with a caveat: ${results[2] ?? ""}` },
  { type: "citation", chunkId: "projects/agentguard.py#results" },
  {
    type: "done",
    trace: {
      model: "gemini-3.5-flash-lite",
      effort: null,
      thinking: "minimal",
      contextVersion: "7e6b8c05c908",
      citedChunks: ["projects/agentguard.py#built", "projects/agentguard.py#results"],
      cachedAnswer: false,
      declined: false,
      inputTokens: 212,
      outputTokens: 118,
      cacheReadTokens: 4371,
      cacheWriteTokens: 0,
      ttftMs: 512,
      totalMs: 1684,
    },
  },
];

async function mockAnswer(page: Page) {
  await page.route("**/api/copilot", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: ANSWER.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""),
    }),
  );
}

async function open(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Welcome" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  if (viewport === DESKTOP)
    await page.getByRole("button", { name: "Assistant", exact: true }).click();
  else await page.getByRole("button", { name: /^Assistant:/ }).click();
}

const panel = (page: Page) => page.getByRole("complementary", { name: "Assistant" });
const shot = (page: Page, name: string) => page.screenshot({ path: `${OUT}/${name}.png` });

test.describe("screenshots phase 5", () => {
  for (const [name, viewport] of [
    ["desktop", DESKTOP],
    ["phone", PHONE],
  ] as const) {
    test(`screenshots panel ${name}`, async ({ page }) => {
      await mockAnswer(page);
      await open(page, viewport);
      await shot(page, `panel-${name}`);
      await panel(page)
        .getByRole("button", { name: "What did Jasmeet build in AgentGuard?" })
        .click();
      await expect(panel(page).getByRole("list", { name: "Sources" })).toBeVisible();
      await shot(page, `answer-${name}`);
    });

    test(`screenshots rate limit ${name}`, async ({ page }) => {
      const resetAt = Date.now() + 23 * 60_000;
      await page.route("**/api/copilot", (route) =>
        route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            code: "rate_limited",
            message: "You've reached this hour's limit of 10 questions.",
            resetAt,
            quota: { limit: 10, remaining: 0, resetAt },
          } satisfies ErrorBody),
        }),
      );
      await open(page, viewport);
      await panel(page)
        .getByRole("textbox", { name: "Ask about Jasmeet" })
        .fill("One more question?");
      await panel(page).getByRole("textbox", { name: "Ask about Jasmeet" }).press("Enter");
      await expect(panel(page).getByRole("status")).toBeVisible();
      await shot(page, `rate-limit-${name}`);
    });
  }

  test("screenshots trace channel", async ({ page }) => {
    await mockAnswer(page);
    await open(page, DESKTOP);
    await panel(page)
      .getByRole("button", { name: "What did Jasmeet build in AgentGuard?" })
      .click();
    await expect(panel(page).getByRole("list", { name: "Sources" })).toBeVisible();
    await page.getByRole("menubar").getByRole("menuitem", { name: "Assistant" }).click();
    await page.getByRole("menuitem", { name: "Show Trace" }).click();
    await expect(page.getByRole("list", { name: "Assistant trace" })).toBeVisible();
    await shot(page, "trace-desktop");
  });
});
