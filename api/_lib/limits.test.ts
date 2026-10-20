import { describe, expect, it } from "vitest";
import { memoryCounter, pacificDay, pacificDayLimiter } from "./limits";
import { memoryQuotaLatch } from "./store";

const utc = (...args: [number, number, number, number, number?]) => Date.UTC(...args);

describe("pacificDay", () => {
  it("names the Pacific date and ends at the next midnight Pacific", () => {
    // 2026-10-20 06:59 UTC is still 2026-10-19 in Los Angeles (PDT, UTC-7).
    expect(pacificDay(utc(2026, 9, 20, 6, 59))).toEqual({
      key: "2026-10-19",
      resetAt: utc(2026, 9, 20, 7),
    });
    expect(pacificDay(utc(2026, 9, 20, 7))).toEqual({
      key: "2026-10-20",
      resetAt: utc(2026, 9, 21, 7),
    });
  });

  it("follows daylight saving time in both directions", () => {
    // PDT ends 2026-11-01 at 02:00: that day is 25 hours long.
    expect(pacificDay(utc(2026, 9, 31, 19))).toEqual({
      key: "2026-10-31",
      resetAt: utc(2026, 10, 1, 7),
    });
    expect(pacificDay(utc(2026, 10, 1, 8, 30))).toEqual({
      key: "2026-11-01",
      resetAt: utc(2026, 10, 2, 8),
    });
    // PDT starts 2027-03-14 at 02:00: that day is 23 hours long.
    expect(pacificDay(utc(2027, 2, 14, 9))).toEqual({
      key: "2027-03-14",
      resetAt: utc(2027, 2, 15, 7),
    });
  });
});

describe("pacificDayLimiter", () => {
  it("counts per Pacific day, so the cap resets when Google's quota does", async () => {
    let now = utc(2026, 9, 20, 23); // 16:00 PDT
    const limiter = pacificDayLimiter(memoryCounter(), 2, () => now);
    expect((await limiter.limit("global")).success).toBe(true);
    expect((await limiter.limit("global")).success).toBe(true);
    // Midnight UTC passes; it's still the same Pacific day.
    now = utc(2026, 9, 21, 1);
    expect(await limiter.limit("global")).toMatchObject({
      success: false,
      remaining: 0,
      reset: utc(2026, 9, 21, 7),
    });
    now = utc(2026, 9, 21, 7);
    expect(await limiter.peek("global")).toMatchObject({ remaining: 2 });
    expect((await limiter.limit("global")).success).toBe(true);
  });
});

describe("memoryQuotaLatch", () => {
  it("holds until the time it was set to, then lets go", async () => {
    let now = 0;
    const latch = memoryQuotaLatch(() => now);
    expect(await latch.until()).toBeNull();
    await latch.set(1000);
    expect(await latch.until()).toBe(1000);
    now = 1000;
    expect(await latch.until()).toBeNull();
  });
});
