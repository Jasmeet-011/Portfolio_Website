import { expect, test } from "./fixtures";

test("the title bar shows red, yellow and green traffic lights", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const dots = page.getByTestId("traffic-lights").locator("span");
  await expect(dots).toHaveCount(3);
  const colors = await dots.evaluateAll((spans) =>
    spans.map((s) => getComputedStyle(s).backgroundColor),
  );
  expect(colors).toEqual(["rgb(255, 95, 87)", "rgb(254, 188, 46)", "rgb(40, 200, 64)"]);
});

test("phones have no traffic lights", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open explorer" })).toBeVisible();
  await expect(page.getByTestId("traffic-lights")).toHaveCount(0);
});

test("the mark is in the title bar and Help > About, and the favicon files load", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("banner").locator("svg[data-mark]")).toBeVisible();
  await page.getByRole("menubar").getByRole("menuitem", { name: "Help" }).click();
  await page.getByRole("menuitem", { name: "About" }).click();
  await expect(page.getByRole("dialog", { name: "About" }).locator("svg[data-mark]")).toBeVisible();

  const icons = await page
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((els) => els.map((el) => (el as HTMLLinkElement).href));
  expect(icons).toHaveLength(3);
  for (const href of icons) expect((await request.get(href)).status()).toBe(200);
});
