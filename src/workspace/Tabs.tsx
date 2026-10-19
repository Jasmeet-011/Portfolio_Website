import { X } from "lucide-react";
import { useEffect, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileIcon } from "@/assets/file-icons/FileIcon";
import { cx } from "@/lib/cx";
import { useWorkspace } from "@/store/workspace";
import { docById, tabDomId, type Doc } from "./documents";
import { useCloseTab } from "./navigation";

// The target tab is already rendered, so focus moves synchronously and the next key press lands on it.
const focusTab = (doc: Doc) => document.getElementById(tabDomId(doc))?.focus();

/**
 * Open editors. Arrow keys, Home and End move between tabs (and open them),
 * Delete closes the focused tab, and a middle click closes any tab.
 */
export function Tabs({ activeId }: { activeId: string | undefined }) {
  const ids = useWorkspace((s) => s.tabs);
  const tabs = ids.map(docById).filter((d): d is Doc => d !== undefined);
  const navigate = useNavigate();
  const closeTab = useCloseTab(activeId);

  useEffect(() => {
    const active = activeId ? docById(activeId) : undefined;
    if (active) {
      document
        .getElementById(tabDomId(active))
        // The whole tab, close button included.
        ?.parentElement?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeId, ids]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[
      event.key
    ];
    if (target !== undefined) {
      event.preventDefault();
      const next = tabs[(target + tabs.length) % tabs.length];
      if (next) {
        navigate(next.route);
        focusTab(next);
      }
    } else if (event.key === "Delete") {
      const doc = tabs[index];
      if (!doc) return;
      event.preventDefault();
      closeTab(doc.id);
      const neighbour = tabs.filter((t) => t.id !== doc.id)[Math.min(index, tabs.length - 2)];
      if (neighbour) focusTab(neighbour);
    }
  };

  const focusable = activeId && tabs.some((t) => t.id === activeId) ? activeId : tabs[0]?.id;

  return (
    <div
      role="tablist"
      aria-label="Open editors"
      className="flex h-11 shrink-0 overflow-x-auto bg-chrome shadow-[inset_0_-1px_0_var(--border)] [scrollbar-width:none] md:h-9"
    >
      {tabs.map((doc, index) => {
        const selected = doc.id === activeId;
        return (
          <div
            key={doc.id}
            role="presentation"
            className={cx(
              "group relative flex shrink-0 items-center border-r border-border",
              selected ? "bg-editor text-text" : "text-muted hover:bg-hover",
            )}
          >
            {selected && <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" aria-hidden />}
            <Link
              to={doc.route}
              id={tabDomId(doc)}
              role="tab"
              aria-selected={selected}
              aria-controls={selected ? "editor-panel" : undefined}
              tabIndex={doc.id === focusable ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, index)}
              onMouseDown={(e) => {
                if (e.button === 1) e.preventDefault();
              }}
              onAuxClick={(e) => {
                if (e.button !== 1) return;
                e.preventDefault();
                closeTab(doc.id);
              }}
              className="flex h-full max-w-56 items-center gap-1.5 pr-1 pl-3"
            >
              <FileIcon icon={doc.icon} />
              <span className="truncate">{doc.title}</span>
            </Link>
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Close ${doc.title}`}
              onClick={() => closeTab(doc.id)}
              className={cx(
                "mr-1.5 grid size-5 place-items-center rounded hover:bg-surface pointer-coarse:opacity-100",
                selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
