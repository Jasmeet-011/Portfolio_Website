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
