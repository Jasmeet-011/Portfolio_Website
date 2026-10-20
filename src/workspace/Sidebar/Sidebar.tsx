import { useWorkspace, type SidebarView } from "@/store/workspace";
import { VIEW_TITLES } from "../views";
import { Explorer } from "./Explorer";
import { ExtensionsView } from "./ExtensionsView";
import { SearchView } from "./SearchView";
import { SettingsView } from "./SettingsView";
import { SourceControlView } from "./SourceControlView";

/** The active view's contents. Shared by the desktop sidebar and the phone drawer. */
export function SidebarContent({
  view,
  activeId,
  touch = false,
}: {
  view: SidebarView;
  activeId: string | undefined;
  touch?: boolean;
}) {
  switch (view) {
    case "explorer":
      return <Explorer activeId={activeId} touch={touch} />;
    case "search":
      return <SearchView />;
    case "scm":
      return <SourceControlView />;
    case "extensions":
      return <ExtensionsView />;
    case "settings":
      return <SettingsView />;
  }
}

export function Sidebar({ activeId }: { activeId: string | undefined }) {
  const view = useWorkspace((s) => s.sidebarView);
  return (
    <div className="flex w-64 shrink-0 flex-col border-r border-border bg-chrome">
      <div className="flex h-9 shrink-0 items-center px-4">
        <h2 className="text-sm font-medium text-muted">{VIEW_TITLES[view]}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarContent view={view} activeId={activeId} />
      </div>
    </div>
  );
}
