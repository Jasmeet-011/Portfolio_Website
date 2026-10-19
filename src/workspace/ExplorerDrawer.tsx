import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useWorkspace } from "@/store/workspace";
import { EXPLORER_TOGGLE_ID } from "./MobileTopBar";
import { Explorer } from "./Sidebar/Explorer";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex="0"]';

/** The explorer as a modal drawer on phones. Traps focus and returns it on close. */
export function ExplorerDrawer({ activeId }: { activeId: string | undefined }) {
  const open = useWorkspace((s) => s.drawerOpen);
  const setDrawerOpen = useWorkspace((s) => s.setDrawerOpen);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const current = panel.querySelector<HTMLElement>('[aria-current="page"]');
    (current ?? panel.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
      if (e.key !== "Tab") return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.getElementById(EXPLORER_TOGGLE_ID)?.focus();
    };
  }, [open, setDrawerOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-chrome/80"
        onClick={() => setDrawerOpen(false)}
        aria-hidden
      />
      <div
        ref={panelRef}
        id="explorer-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Explorer"
        className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-border bg-chrome"
      >
        <div className="flex h-11 shrink-0 items-center justify-between pr-0 pl-4">
          <h2 className="text-xs font-medium text-muted">Explorer</h2>
          <button
            type="button"
            aria-label="Close explorer"
            onClick={() => setDrawerOpen(false)}
            className="grid size-11 place-items-center text-text"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Explorer activeId={activeId} touch />
        </div>
      </div>
    </div>
  );
}
