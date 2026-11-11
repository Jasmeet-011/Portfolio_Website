import { expect, test } from "./fixtures";

// Only requests that are rejected before any model call, so this never costs anything,
// with or without an API key in .env.local.
test("npm run dev serves the assistant function at /api/copilot", async ({ request }) => {
  // The availability check: always 200, true or false depending on whether a key is set.
  const get = await request.get("/api/copilot");
  expect(get.status()).toBe(200);
  expect(typeof (await get.json()).available).toBe("boolean");

  const put = await request.put("/api/copilot", { data: {} });
  expect(put.status()).toBe(405);
  expect(await put.json()).toMatchObject({ code: "invalid" });

  const bad = await request.post("/api/copilot", {
    headers: { "content-type": "application/json" },
    data: "{not json",
  });
  expect(bad.status()).toBe(400);

  const tooLong = await request.post("/api/copilot", { data: { question: "x".repeat(501) } });
  expect(tooLong.status()).toBe(400);
});
