import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { useIsDesktop } from "@/lib/useMediaQuery";
import { useWorkspace } from "@/store/workspace";
import { ActivityBar } from "./ActivityBar";
import { Breadcrumbs } from "./Breadcrumbs";
import { docForPath } from "./documents";
import { Editor } from "./Editor";
import { ExplorerDrawer } from "./ExplorerDrawer";
import { MobileTopBar } from "./MobileTopBar";
import { isClosedAll } from "./navigation";
import { Panel } from "./Panel/Panel";
import { Sidebar } from "./Sidebar/Sidebar";
import { StatusBar } from "./StatusBar";
import { Tabs } from "./Tabs";
import { TitleBar } from "./TitleBar";
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

  useLayoutEffect(() => {
    if (!active) return;
    const ws = useWorkspace.getState();
    ws.openTab(active.id);
    ws.expandFolders(ancestorKeys(active));
    if (active.view) ws.showView(active.view);
  }, [active]);

  // The phone drawer closes after every navigation and when the layout turns desktop.
  useEffect(() => {
    useWorkspace.getState().setDrawerOpen(false);
  }, [location.key, isDesktop]);

  return (
    <div className="flex h-dvh flex-col bg-editor text-text">
      {isDesktop ? <TitleBar /> : <MobileTopBar />}
      <div className="flex min-h-0 flex-1">
        {isDesktop && <ActivityBar />}
        {isDesktop && sidebarOpen && <Sidebar activeId={active?.id} />}
        <div className="flex min-w-0 flex-1 flex-col">
          <Tabs activeId={active?.id} />
          <Breadcrumbs doc={active} />
          <Editor doc={doc} active={active} pathname={location.pathname} />
          {panelOpen && <Panel isDesktop={isDesktop} />}
        </div>
      </div>
      <StatusBar doc={active} />
      {!isDesktop && <ExplorerDrawer activeId={active?.id} />}
    </div>
  );
}
