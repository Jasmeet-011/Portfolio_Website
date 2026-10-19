// Fails when a theme misses a token, a text pair drops below WCAG AA, a fill-only token is
// used as text, or a component hardcodes a color. Run by `npm run build`.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const TOKENS = [
  "editor",
  "chrome",
  "activitybar",
  "titlebar",
  "surface",
  "hover",
  "selection",
  "border",
  "text",
  "muted",
  "accent",
  "on-accent",
  "link",
  "focus",
  "statusbar",
  "on-statusbar",
  "comment",
  "highlight",
  "tag",
  "assistant",
  "on-assistant",
  "assistant-text",
  "assistant-panel",
];

// Every surface that text can sit on.
const SURFACES = ["editor", "chrome", "activitybar", "titlebar", "surface", "hover", "selection"];

// [foreground, background, minimum ratio]. 4.5 for text, 3 for focus rings and fills.
const PAIRS = [
  ...SURFACES.flatMap((bg) => [
    ["text", bg, 4.5],
    ["muted", bg, 4.5],
  ]),
  // Accent text: links, comment-style lines, the wordmark accent, tags.
  ...["link", "comment", "highlight", "tag", "assistant-text"].flatMap((fg) => [
    [fg, "editor", 4.5],
    [fg, "chrome", 4.5],
  ]),
  // Text on fills.
  ["on-accent", "accent", 4.5],
  ["on-statusbar", "statusbar", 4.5],
  ["on-assistant", "assistant", 4.5],
  // The assistant panel.
  ["text", "assistant-panel", 4.5],
  ["assistant-text", "assistant-panel", 4.5],
  // Non-text: focus rings and blue fills must stand out from the surfaces they sit on.
  ["focus", "editor", 3],
  ["focus", "chrome", 3],
  ["focus", "titlebar", 3],
  ["accent", "editor", 3],
  ["accent", "chrome", 3],
];

// Fill-only tokens: below AA as text on the dark surfaces, so never used as a text color.
const FILL_ONLY = /\b(?:text|placeholder|caret)-(?:accent|assistant|statusbar)\b/;

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
    [...css.matchAll(/^\s*--([\w-]+):\s*(#[0-9a-f]{6});/gim)].map((m) => [
      m[1],
      m[2].toLowerCase(),
    ]),
  );
  console.log(file);
  for (const t of TOKENS) if (!vars[t]) fail(`${file}: missing --${t}`);
  for (const t of Object.keys(vars)) if (!TOKENS.includes(t)) fail(`${file}: unknown token --${t}`);
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
      if (FILL_ONLY.test(line))
        fail(`${file}:${i + 1} uses a fill-only token as text: ${line.trim()}`);
    });
}

console.log(
  failures
    ? `\n${failures} theme check(s) failed`
    : "\nThemes OK: tokens complete, AA contrast, fill-only tokens never text, no hardcoded colors",
);
process.exit(failures ? 1 : 0);
