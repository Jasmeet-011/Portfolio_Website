import { readFileSync } from "node:fs";
import { test } from "@playwright/test";

/**
 * A comparison sheet of the logo options in docs/logo (built by scripts/build-favicon.mjs):
 * each mark at favicon and UI sizes, on dark and light backgrounds, in a browser tab and
 * in the title bar. Colors here are the sheet's own, not the site's theme.
 */
const SIZES = [16, 24, 32, 64, 128];
const data = JSON.parse(readFileSync("src/assets/logo/marks.json", "utf8")) as {
  marks: Record<string, { label: string }>;
};

function row(id: string, label: string): string {
  const svg = readFileSync(`docs/logo/${id}.svg`, "utf8");
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const img = (s: number) => `<img src="${src}" width="${s}" height="${s}">`;
  const strip = (bg: string, fg: string) =>
    `<div class="strip" style="background:${bg};color:${fg}">${SIZES.map(img).join("")}</div>`;
  return `<section>
    <h2>${label}</h2>
    ${strip("#1e1e1e", "#f5f5f5")}
    ${strip("#f7f8fa", "#1c2330")}
    <div class="tabs">
      <div class="tab dark">${img(16)}<span>Jasmeet Singh Wadhwa</span></div>
      <div class="tab light">${img(16)}<span>Jasmeet Singh Wadhwa</span></div>
    </div>
    <div class="titlebar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i>${img(18)}<span>File</span><span>Edit</span><span>View</span><span>Go</span></div>
  </section>`;
}

test("screenshots logo options", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  const marks = Object.entries(data.marks);
  await page.setContent(`<html><head><style>
    body { margin: 0; padding: 24px; background: #2b2b2b; color: #f5f5f5; font: 14px system-ui, sans-serif; }
    section { margin-bottom: 28px; }
    h2 { font-size: 16px; margin: 0 0 8px; }
    .strip { display: flex; align-items: center; gap: 28px; padding: 14px 18px; border-radius: 6px; margin-bottom: 6px; }
    .tabs { display: flex; gap: 8px; margin: 8px 0; }
    .tab { display: flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 8px 8px 0 0; width: 220px; }
    .tab.dark { background: #35363a; color: #e8eaed; } .tab.light { background: #ffffff; color: #1f1f1f; }
    .titlebar { display: flex; align-items: center; gap: 10px; background: #1a1a2e; padding: 8px 12px; border-radius: 6px; width: 420px; }
    .titlebar i { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
    .titlebar img { margin-left: 6px; } .titlebar span { color: #f5f5f5; }
  </style></head><body>${marks.map(([id, m]) => row(id, m.label)).join("")}</body></html>`);
  await page.screenshot({ path: "screenshots/phase-4.5/logo-options.png", fullPage: true });
});
