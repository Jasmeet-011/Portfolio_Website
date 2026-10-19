// Fails when a theme misses a token, a text pair drops below WCAG AA, or a component
// hardcodes a color. Run by `npm run build`.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const TOKENS = [
  "chrome",
  "editor",
  "surface",
  "hover",
  "border",
  "text",
  "muted",
  "accent",
  "on-accent",
  "link",
  "focus",
  "statusbar",
  "on-statusbar",
];

// [foreground, background, minimum ratio]. 4.5 for text, 3 for focus rings and fills.
const PAIRS = [
  ["text", "editor", 4.5],
  ["text", "chrome", 4.5],
  ["text", "surface", 4.5],
  ["text", "hover", 4.5],
  ["muted", "editor", 4.5],
  ["muted", "chrome", 4.5],
  ["muted", "hover", 4.5],
  ["link", "editor", 4.5],
  ["link", "chrome", 4.5],
  ["on-statusbar", "statusbar", 4.5],
  ["on-accent", "accent", 4.5],
  ["focus", "editor", 3],
  ["focus", "chrome", 3],
  ["accent", "editor", 3],
  ["accent", "chrome", 3],
];

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  FAIL ${msg}`);
};

const dir = "src/themes";
for (const file of readdirSync(dir).filter((f) => f.endsWith(".css"))) {
  const css = readFileSync(join(dir, file), "utf8");
  const vars = Object.fromEntries(
    [...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]),
  );
  console.log(file);
  for (const t of TOKENS) if (!vars[t]) fail(`${file}: missing --${t}`);
  for (const [fg, bg, min] of PAIRS) {
    if (!vars[fg] || !vars[bg]) continue;
    const r = ratio(vars[fg], vars[bg]);
    if (r < min) fail(`${file}: --${fg} on --${bg} is ${r.toFixed(2)}:1, needs ${min}:1`);
  }
}

const walk = (p) =>
  statSync(p).isDirectory() ? readdirSync(p).flatMap((n) => walk(join(p, n))) : [p];
const COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(/i;
for (const file of walk("src").filter(
  (f) => /\.(tsx?|css)$/.test(f) && !f.startsWith(join("src", "themes")),
)) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (COLOR.test(line)) fail(`${file}:${i + 1} hardcodes a color: ${line.trim()}`);
    });
}

console.log(
  failures
    ? `\n${failures} theme check(s) failed`
    : "\nThemes OK: tokens complete, AA contrast, no hardcoded colors",
);
process.exit(failures ? 1 : 0);
