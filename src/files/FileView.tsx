import { Code2, Eye } from "lucide-react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { cx } from "@/lib/cx";
import type { Doc } from "@/workspace/documents";
import type { SourceLang } from "./source/highlight";
import { SourceView } from "./source/SourceView";

const LANG_BY_LANGUAGE: Record<string, SourceLang> = {
  Python: "python",
  TypeScript: "typescript",
  JavaScript: "javascript",
  Markdown: "markdown",
  HTTP: "http",
};

/**
 * A file with a Preview / Source toggle, like VS Code's Markdown preview.
 * The mode lives in the URL (?view=source), so either view can be linked.
 */
export function FileView({
  doc,
  preview,
  source,
}: {
  doc: Doc;
  preview: ReactNode;
  /** Called only when the source view is shown. */
  source: () => string;
}) {
  const [params, setParams] = useSearchParams();
  const mode = params.get("view") === "source" ? "source" : "preview";
  const lang = LANG_BY_LANGUAGE[doc.language ?? ""] ?? "markdown";

  const setMode = (next: "preview" | "source") =>
    setParams(next === "source" ? { view: "source" } : {}, { replace: true });

  const button = (value: "preview" | "source", label: string, icon: ReactNode) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => setMode(value)}
      className={cx(
        "flex h-7 items-center gap-1.5 px-2.5 text-xs",
        mode === value ? "bg-selection text-text" : "text-muted hover:text-text",
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex justify-end px-4 pt-3 sm:px-6">
        <div
          role="group"
          aria-label="View"
          className="flex overflow-hidden rounded-md border border-border"
        >
          {button("preview", "Preview", <Eye className="size-3.5" aria-hidden />)}
          {button("source", "Source", <Code2 className="size-3.5" aria-hidden />)}
        </div>
      </div>
      {mode === "preview" ? preview : <SourceView code={source()} lang={lang} />}
    </div>
  );
}
