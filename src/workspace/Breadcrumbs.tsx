import { Fragment } from "react";
import { FileIcon } from "@/assets/file-icons/FileIcon";
import { WORKSPACE_NAME, type Doc } from "./documents";
import { useRevealFolder } from "./navigation";

function Separator() {
  return (
    <span className="px-0.5" aria-hidden>
      ›
    </span>
  );
}

/** The active file's path. Each folder opens the explorer at that folder. */
export function Breadcrumbs({ doc }: { doc: Doc | undefined }) {
  const reveal = useRevealFolder();
  if (!doc || doc.path.length === 0) return null;
  const folders = doc.path.slice(0, -1);
  const segment = "rounded px-1 hover:text-text";
  return (
    <nav aria-label="Breadcrumbs" className="shrink-0 bg-editor">
      <ol className="flex h-6 items-center overflow-x-auto px-3 text-xs whitespace-nowrap text-muted [scrollbar-width:none]">
        <li>
          <button type="button" className={segment} onClick={() => reveal("")}>
            {WORKSPACE_NAME}
          </button>
        </li>
        {folders.map((name, i) => (
          <Fragment key={name}>
            <Separator />
            <li>
              <button
                type="button"
                className={segment}
                onClick={() => reveal(folders.slice(0, i + 1).join("/"))}
              >
                {name}
              </button>
            </li>
          </Fragment>
        ))}
        <Separator />
        <li aria-current="page" className="flex items-center gap-1 px-1 text-text">
          <FileIcon icon={doc.icon} className="size-3.5" />
          {doc.title}
        </li>
      </ol>
    </nav>
  );
}
