import { useWorkspace, type SidebarView } from "@/store/workspace";
import { ThemeOptions } from "../ThemeOptions";
import { Explorer } from "./Explorer";
import { ExtensionsView } from "./ExtensionsView";
import { SourceControlView } from "./SourceControlView";

const TITLES: Record<SidebarView, string> = {
  explorer: "Explorer",
  search: "Search",
  scm: "Source control",
  run: "Run and debug",
  extensions: "Extensions",
  settings: "Settings",
};

/** Views that later phases fill in. */
const UPCOMING: Partial<Record<SidebarView, string>> = {
  search: "Full-text search across every file arrives in Phase 4.",
  run: "Launch configurations for live demos arrive in Phase 4.",
};

export function Sidebar({ activeId }: { activeId: string | undefined }) {
  const view = useWorkspace((s) => s.sidebarView);
  const upcoming = UPCOMING[view];
  return (
    <div className="flex w-64 shrink-0 flex-col border-r border-border bg-chrome">
      <div className="flex h-9 shrink-0 items-center px-4">
        <h2 className="text-xs font-medium text-muted">{TITLES[view]}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {view === "explorer" && <Explorer activeId={activeId} />}
        {view === "scm" && <SourceControlView />}
        {view === "extensions" && <ExtensionsView />}
        {view === "settings" && (
          <div className="px-2 py-1">
            <ThemeOptions />
          </div>
        )}
        {upcoming && <p className="px-4 py-1 text-muted">{upcoming}</p>}
      </div>
    </div>
  );
}
