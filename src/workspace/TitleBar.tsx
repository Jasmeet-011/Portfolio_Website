import { Menu, Search } from "lucide-react";
import { WORKSPACE_NAME } from "./documents";

const MENUS = ["File", "Edit", "View", "Go", "Run", "Terminal", "Help", "Assistant"];

/** Phase 2 renders the menu bar's structure only. Phase 4 wires every item. */
function MenuBar() {
  return (
    <>
      <nav aria-label="Application menu" className="hidden items-center xl:flex">
        {MENUS.map((label) => (
          <button
            key={label}
            type="button"
            aria-haspopup="menu"
            aria-disabled="true"
            className="h-6 rounded px-1.5 text-[13px] text-text"
          >
            {label}
          </button>
        ))}
      </nav>
      <button
        type="button"
        aria-label="Application menu"
        aria-haspopup="menu"
        aria-disabled="true"
        className="grid size-7 place-items-center rounded text-muted xl:hidden"
      >
        <Menu className="size-4" aria-hidden />
      </button>
    </>
  );
}

/** Window dots, drawn in the theme's border color rather than macOS colors. */
function WindowDots() {
  return (
    <div className="flex shrink-0 gap-2" aria-hidden="true">
      <span className="size-3 rounded-full bg-border" />
      <span className="size-3 rounded-full bg-border" />
      <span className="size-3 rounded-full bg-border" />
    </div>
  );
}

export function TitleBar() {
  return (
    <header className="grid h-9 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border bg-chrome px-3">
      <div className="flex min-w-0 items-center gap-3">
        <WindowDots />
        <MenuBar />
      </div>
      <button
        type="button"
        aria-label="Search files and commands"
        aria-disabled="true"
        title="The command palette arrives in Phase 4"
        className="flex h-6 w-[clamp(12rem,26vw,32rem)] items-center justify-center gap-2 rounded-md border border-border bg-editor px-3 text-xs text-muted"
      >
        <Search className="size-3.5" aria-hidden />
        <span className="truncate">{WORKSPACE_NAME}</span>
      </button>
      <div />
    </header>
  );
}
