import { useEffect, useState } from "react";
import type { SourceLang } from "./highlight";

interface Token {
  content: string;
  color?: string;
  fontStyle?: number;
}

/**
 * A file's source with line numbers. Renders plain text at once and swaps in
 * Shiki's tokens when the highlighter has loaded. Long lines wrap with a hanging
 * indent, so the gutter stays aligned on phones.
 */
export function SourceView({ code, lang }: { code: string; lang: SourceLang }) {
  const [highlighted, setHighlighted] = useState<{ code: string; tokens: Token[][] } | null>(null);

  useEffect(() => {
    let live = true;
    import("./highlight")
      .then((m) => m.tokenize(code, lang))
      .then((tokens) => {
        if (live) setHighlighted({ code, tokens });
      })
      .catch(() => {
        // Plain text stays on screen if highlighting fails.
      });
    return () => {
      live = false;
    };
  }, [code, lang]);

  const lines: Token[][] =
    highlighted?.code === code ? highlighted.tokens : code.split("\n").map((l) => [{ content: l }]);

  return (
    <pre
      aria-label="Source"
      data-highlighted={highlighted?.code === code}
      className="py-4 font-mono text-[15px] leading-6"
    >
      <code className="block">
        {lines.map((line, i) => (
          <span key={i} className="flex">
            <span
              aria-hidden="true"
              className="w-14 shrink-0 pr-5 text-right text-muted select-none"
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 pr-6 pl-[2ch] -indent-[2ch] break-words whitespace-pre-wrap">
              {line.length === 0
                ? "\n"
                : line.map((t, j) => (
                    <span
                      key={j}
                      style={{
                        color: t.color,
                        fontStyle: t.fontStyle && t.fontStyle & 1 ? "italic" : undefined,
                      }}
                    >
                      {t.content}
                    </span>
                  ))}
            </span>
          </span>
        ))}
      </code>
    </pre>
  );
}
