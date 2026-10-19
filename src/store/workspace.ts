import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SidebarView = "explorer" | "search" | "scm" | "run" | "extensions" | "settings";
export type PanelTab = "terminal" | "problems" | "output";

interface WorkspaceState {
  /** Open editor tabs, as document ids, in display order. */
  tabs: string[];
  sidebarView: SidebarView;
  sidebarOpen: boolean;
  panelOpen: boolean;
  panelTab: PanelTab;
  /** Explorer folders by key: "" is the workspace root, "projects/archive" a subfolder. */
  expanded: Record<string, boolean>;
  /** The explorer drawer on phones. Not persisted. */
  drawerOpen: boolean;

  openTab: (id: string) => void;
  closeTab: (id: string) => void;
  /** Activity bar behaviour: clicking the active view hides the sidebar. */
  toggleView: (view: SidebarView) => void;
  showView: (view: SidebarView) => void;
  togglePanel: (tab?: PanelTab) => void;
  setPanelTab: (tab: PanelTab) => void;
  closePanel: () => void;
  toggleFolder: (key: string) => void;
  expandFolders: (keys: string[]) => void;
  setDrawerOpen: (open: boolean) => void;
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set) => ({
      tabs: [],
      sidebarView: "explorer",
      sidebarOpen: true,
      panelOpen: false,
      panelTab: "terminal",
      expanded: { "": true, projects: true },
      drawerOpen: false,

      openTab: (id) => set((s) => (s.tabs.includes(id) ? s : { tabs: [...s.tabs, id] })),
      closeTab: (id) => set((s) => ({ tabs: s.tabs.filter((t) => t !== id) })),
      toggleView: (view) =>
        set((s) =>
          s.sidebarOpen && s.sidebarView === view
            ? { sidebarOpen: false }
            : { sidebarOpen: true, sidebarView: view },
        ),
      showView: (view) => set({ sidebarOpen: true, sidebarView: view }),
      togglePanel: (tab) =>
        set((s) =>
          s.panelOpen && (!tab || tab === s.panelTab)
            ? { panelOpen: false }
            : { panelOpen: true, panelTab: tab ?? s.panelTab },
        ),
      setPanelTab: (tab) => set({ panelTab: tab }),
      closePanel: () => set({ panelOpen: false }),
      toggleFolder: (key) => set((s) => ({ expanded: { ...s.expanded, [key]: !s.expanded[key] } })),
      expandFolders: (keys) =>
        set((s) =>
          keys.every((k) => s.expanded[k])
            ? s
            : { expanded: { ...s.expanded, ...Object.fromEntries(keys.map((k) => [k, true])) } },
        ),
      setDrawerOpen: (open) => set({ drawerOpen: open }),
    }),
    {
      name: "workspace",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        tabs: s.tabs,
        sidebarView: s.sidebarView,
        sidebarOpen: s.sidebarOpen,
        panelOpen: s.panelOpen,
        panelTab: s.panelTab,
        expanded: s.expanded,
      }),
    },
  ),
);
