import { Search } from "lucide-react";
import { useWorkspace } from "@/store/workspace";
import { useCommands } from "./commands";
import { WORKSPACE_NAME } from "./documents";
import { formatKeys } from "./keys";
import { MenuBar } from "./MenuBar";

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
  const setPalette = useWorkspace((s) => s.setPalette);
  const goToFile = useCommands().find((c) => c.id === "go.file")?.keys?.[0];
  return (
    <header className="grid h-9 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border bg-titlebar px-3">
      <div className="flex min-w-0 items-center gap-3">
        <WindowDots />
        <MenuBar />
      </div>
      <button
        type="button"
        aria-label="Search files and commands"
        title={goToFile ? `Go to File (${formatKeys(goToFile)})` : undefined}
        onClick={() => setPalette("")}
        className="flex h-6 w-[clamp(12rem,26vw,32rem)] items-center justify-center gap-2 rounded-md border border-border bg-editor px-3 text-xs text-muted hover:border-muted hover:text-text"
      >
        <Search className="size-3.5" aria-hidden />
        <span className="truncate">{WORKSPACE_NAME}</span>
      </button>
      <div />
    </header>
  );
}
