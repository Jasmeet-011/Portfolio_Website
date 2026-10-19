import { test as base, expect } from "@playwright/test";

/** Every test fails if the page logs a console error or warning, or throws. */
export const test = base.extend({
  page: async ({ page }, use) => {
    // No test ever reaches the real Formspree form. Tests that submit register their own
    // response, which takes precedence over this one.
    await page.route("https://formspree.io/**", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"blocked in tests"}',
      }),
    );
    const problems: string[] = [];
    page.on("console", (msg) => {
      // Chrome logs every non-2xx fetch. contact.http shows Formspree's error responses on
      // purpose, so those are expected; anything else still fails the test.
      if (msg.location().url.startsWith("https://formspree.io/")) return;
      if (msg.type() === "error" || msg.type() === "warning") {
        problems.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    page.on("pageerror", (error) => problems.push(`uncaught: ${error.message}`));
    await use(page);
    expect(problems, "console errors or warnings").toEqual([]);
  },
});

export { expect };
