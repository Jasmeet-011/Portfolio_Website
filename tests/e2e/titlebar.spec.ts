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
