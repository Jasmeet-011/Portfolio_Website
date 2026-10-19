import { test as base, expect } from "@playwright/test";

/** Every test fails if the page logs a console error or warning, or throws. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const problems: string[] = [];
    page.on("console", (msg) => {
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
