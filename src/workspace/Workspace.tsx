import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { useIsDesktop } from "@/lib/useMediaQuery";
import { usePreferences } from "@/store/preferences";
import { useWorkspace } from "@/store/workspace";
import { AboutDialog } from "./AboutDialog";
import { ActivityBar } from "./ActivityBar";
import { Breadcrumbs } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { CommandsContext, useCommandList } from "./commands";
import { docForPath } from "./documents";
import { Editor } from "./Editor";
import { MobileTopBar } from "./MobileTopBar";
import { isClosedAll } from "./navigation";
import { Panel } from "./Panel/Panel";
import { useShortcuts } from "./shortcuts";
import { Sidebar } from "./Sidebar/Sidebar";
import { SidebarDrawer } from "./SidebarDrawer";
import { StatusBar } from "./StatusBar";
import { Tabs } from "./Tabs";
import { TitleBar } from "./TitleBar";
import { Toast } from "./Toast";
import { ancestorKeys } from "./tree";

/**
 * The VS Code shell. The URL decides the active document; this component keeps
 * the open tabs and the explorer in step with it, so deep links and the browser's
 * back and forward buttons move between tabs.
 */
export function Workspace() {
  const location = useLocation();
  const doc = docForPath(location.pathname);
  const active = doc && !isClosedAll(location.state) ? doc : undefined;
  const isDesktop = useIsDesktop();
  const sidebarOpen = useWorkspace((s) => s.sidebarOpen);
  const panelOpen = useWorkspace((s) => s.panelOpen);
  // Zen mode is a desktop layout; phones are already minimal.
  const zen = useWorkspace((s) => s.zen !== null) && isDesktop;
  const zoom = usePreferences((s) => s.zoom);
  const commands = useCommandList(active);
  useShortcuts(commands);

  useLayoutEffect(() => {
    if (!active) return;
    const ws = useWorkspace.getState();
    ws.openTab(active.id);
    ws.touchRecent(active.id);
    ws.expandFolders(ancestorKeys(active));
    if (active.view) ws.showView(active.view);
  }, [active]);

  // The phone drawer closes after every navigation and when the layout turns desktop.
  useEffect(() => {
    useWorkspace.getState().setDrawerOpen(false);
  }, [location.key, isDesktop]);

  return (
    <CommandsContext.Provider value={commands}>
      {/* Workspace zoom scales the whole shell; the height keeps it filling the window. */}
      <div
        className="flex flex-col bg-editor text-text"
        style={{ zoom, height: `calc(100dvh / ${zoom})` }}
      >
        {isDesktop ? <TitleBar /> : <MobileTopBar />}
        <div className="flex min-h-0 flex-1">
          {isDesktop && !zen && <ActivityBar />}
          {isDesktop && sidebarOpen && <Sidebar activeId={active?.id} />}
          <div className="flex min-w-0 flex-1 flex-col">
            <Tabs activeId={active?.id} />
            <Breadcrumbs doc={active} />
            <Editor doc={doc} active={active} pathname={location.pathname} />
            {panelOpen && <Panel isDesktop={isDesktop} />}
          </div>
        </div>
        {!zen && <StatusBar doc={active} />}
        {!isDesktop && <SidebarDrawer activeId={active?.id} />}
        <CommandPalette />
        <AboutDialog />
        <Toast />
      </div>
    </CommandsContext.Provider>
  );
}
