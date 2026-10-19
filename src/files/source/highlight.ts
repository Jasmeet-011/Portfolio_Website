import {
  createCssVariablesTheme,
  createHighlighterCore,
  type HighlighterCore,
  type ThemedToken,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

/**
 * Loaded lazily (dynamic import from SourceView), so Shiki never enters the main bundle.
 * Colors come from --shiki-* variables, which index.css maps onto theme tokens.
 */
export type SourceLang = "python" | "typescript" | "javascript" | "markdown" | "http";

const theme = createCssVariablesTheme({ name: "workspace", variablePrefix: "--shiki-" });

let highlighter: Promise<HighlighterCore> | undefined;

function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [theme],
    langs: [
      import("shiki/langs/python.mjs"),
      import("shiki/langs/typescript.mjs"),
      import("shiki/langs/javascript.mjs"),
      import("shiki/langs/markdown.mjs"),
      import("shiki/langs/http.mjs"),
    ],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

export async function tokenize(code: string, lang: SourceLang): Promise<ThemedToken[][]> {
  const h = await getHighlighter();
  return h.codeToTokens(code, { lang, theme: "workspace" }).tokens;
}
