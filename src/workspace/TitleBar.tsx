import { Search } from "lucide-react";
import { Logo } from "@/assets/logo/Logo";
import { useWorkspace } from "@/store/workspace";
import { useCommands } from "./commands";
import { WORKSPACE_NAME } from "./documents";
import { formatKeys } from "./keys";
import { MenuBar } from "./MenuBar";

/**
 * macOS traffic lights: close, minimize, zoom. Decorative, since a web page can't close
 * its window. The title bar only renders from 768px up, so phones never show them.
 */
function TrafficLights() {
  return (
    <div className="flex shrink-0 gap-2" aria-hidden="true" data-testid="traffic-lights">
      <span className="size-3 rounded-full bg-window-close" />
      <span className="size-3 rounded-full bg-window-minimize" />
      <span className="size-3 rounded-full bg-window-zoom" />
    </div>
  );
}

export function TitleBar() {
  const setPalette = useWorkspace((s) => s.setPalette);
  const goToFile = useCommands().find((c) => c.id === "go.file")?.keys?.[0];
  return (
    <header className="grid h-10 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border bg-titlebar px-3">
      <div className="flex min-w-0 items-center gap-3">
        <TrafficLights />
        <Logo size={18} className="shrink-0" />
        <MenuBar />
      </div>
      <button
        type="button"
        aria-label="Search files and commands"
        title={goToFile ? `Go to File (${formatKeys(goToFile)})` : undefined}
        onClick={() => setPalette("")}
        className="flex h-7 w-[clamp(12rem,26vw,32rem)] items-center justify-center gap-2 rounded-md border border-border bg-editor px-3 text-sm text-muted hover:border-muted hover:text-text"
      >
        <Search className="size-3.5" aria-hidden />
        <span className="truncate">{WORKSPACE_NAME}</span>
      </button>
      <div />
    </header>
  );
}
