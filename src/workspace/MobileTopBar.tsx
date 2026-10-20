import { Command, Files } from "lucide-react";
import { useWorkspace } from "@/store/workspace";
import { WORKSPACE_NAME } from "./documents";

export const EXPLORER_TOGGLE_ID = "explorer-toggle";

/** The phone layout's top bar: explorer drawer, workspace name, command palette. */
export function MobileTopBar() {
  const drawerOpen = useWorkspace((s) => s.drawerOpen);
  const setDrawerOpen = useWorkspace((s) => s.setDrawerOpen);
  const showView = useWorkspace((s) => s.showView);
  const setPalette = useWorkspace((s) => s.setPalette);
  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-titlebar">
      <button
        type="button"
        id={EXPLORER_TOGGLE_ID}
        aria-label="Open explorer"
        aria-expanded={drawerOpen}
        aria-controls="sidebar-drawer"
        onClick={() => {
          showView("explorer");
          setDrawerOpen(true);
        }}
        className="grid size-11 place-items-center text-text"
      >
        <Files className="size-5" strokeWidth={1.75} aria-hidden />
      </button>
      <span className="font-mono text-sm">{WORKSPACE_NAME}</span>
      <button
        type="button"
        aria-label="Command palette"
        onClick={() => setPalette("")}
        className="grid size-11 place-items-center text-text"
      >
        <Command className="size-5" strokeWidth={1.75} aria-hidden />
      </button>
    </header>
  );
}
