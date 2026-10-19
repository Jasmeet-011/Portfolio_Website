import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DocumentView } from "@/files/DocumentView";
import { NoEditor, NotFound } from "@/files/EmptyEditor";
import { tabDomId, type Doc } from "./documents";

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
