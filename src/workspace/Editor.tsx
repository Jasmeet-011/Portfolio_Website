import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DocumentView } from "@/files/DocumentView";
import { NoEditor, NotFound } from "@/files/EmptyEditor";
import { findState } from "@/lib/search";
import { tabDomId, type Doc } from "./documents";

const HIGHLIGHT = "search";

/** Every case-insensitive occurrence of `query` in the text under `root`. */
function findRanges(root: HTMLElement, query: string): Range[] {
  const q = query.toLowerCase();
  const ranges: Range[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.toLowerCase() ?? "";
    for (let i = text.indexOf(q); i >= 0; i = text.indexOf(q, i + q.length)) {
      const range = document.createRange();
      range.setStart(node, i);
      range.setEnd(node, i + q.length);
      ranges.push(range);
    }
  }
  return ranges;
}

/**
 * The editor area. `doc` is what the URL points at; `active` is the open tab, which is
 * missing when every tab has been closed.
 */
export function Editor({
  doc,
  active,
  pathname,
}: {
  doc: Doc | undefined;
  active: Doc | undefined;
  pathname: string;
}) {
  const location = useLocation();

  // Links like /experience#qualitest-intern or /skills#python scroll to their section.
  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
  }, [location.key, location.hash]);

  // A search result highlights every match in the file and scrolls to the one it named.
  useEffect(() => {
    const registry = "highlights" in CSS ? CSS.highlights : undefined;
    registry?.delete(HIGHLIGHT);
    const find = findState(location.state);
    if (!find) return;
    const frame = requestAnimationFrame(() => {
      const panel = document.getElementById("editor-panel");
      if (!panel) return;
      const ranges = findRanges(panel, find.find);
      registry?.set(HIGHLIGHT, new Highlight(...ranges));
      const named = find.text.slice(0, 60);
      const target =
        ranges.find((r) => r.startContainer.parentElement?.textContent?.includes(named)) ??
        ranges[0];
      target?.startContainer.parentElement?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.state]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-editor">
      {active ? (
        <div id="editor-panel" role="tabpanel" aria-labelledby={tabDomId(active)}>
          <DocumentView doc={active} />
        </div>
      ) : doc ? (
        <NoEditor />
      ) : (
        <NotFound pathname={pathname} />
      )}
    </main>
  );
}
