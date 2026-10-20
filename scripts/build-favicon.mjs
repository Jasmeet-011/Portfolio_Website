// Turns the logo marks in src/assets/logo/marks.json into files:
//   docs/logo/<id>.svg       every option, for review
//   public/favicon.svg       the chosen mark
//   public/favicon-32.png    PNG fallback for browsers without SVG favicons
//   public/apple-touch-icon.png  180px, for iOS home screens
// Run after changing marks.json: node scripts/build-favicon.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const data = JSON.parse(readFileSync("src/assets/logo/marks.json", "utf8"));
const { accent, ink } = data.colors;

function svgFor(id) {
  const m = data.marks[id];
  const paths = m.paths.map((d) => `<path d="${d}"/>`).join("");
  const rects = m.rects
    .map(
      (r) =>
        `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="${r.rx}" fill="${ink}"/>`,
    )
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<rect x="1" y="1" width="30" height="30" rx="7" fill="${accent}"/>` +
    `<g fill="none" stroke="${ink}" stroke-width="${m.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>` +
    `${rects}</svg>\n`
  );
}

mkdirSync("docs/logo", { recursive: true });
mkdirSync("public", { recursive: true });
for (const id of Object.keys(data.marks)) writeFileSync(`docs/logo/${id}.svg`, svgFor(id));
const chosen = svgFor(data.chosen);
writeFileSync("public/favicon.svg", chosen);

const browser = await chromium.launch();
const page = await browser.newPage();
const src = `data:image/svg+xml;base64,${Buffer.from(chosen).toString("base64")}`;
for (const [file, size] of [
  ["public/favicon-32.png", 32],
  ["public/apple-touch-icon.png", 180],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img src="${src}" width="${size}" height="${size}" style="display:block"></body></html>`,
  );
  await page.screenshot({ path: file, omitBackground: true });
}
await browser.close();
console.log(`favicon: ${data.chosen}; options in docs/logo/`);
