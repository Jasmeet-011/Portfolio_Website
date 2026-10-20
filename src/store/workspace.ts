import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const SIDEBAR_VIEWS = ["explorer", "search", "scm", "extensions", "settings"] as const;
export type SidebarView = (typeof SIDEBAR_VIEWS)[number];
export const PANEL_TABS = ["terminal", "problems", "output"] as const;
export type PanelTab = (typeof PANEL_TABS)[number];

/** Something that should take focus once it renders, e.g. the search box. */
export type FocusTarget = "search" | "terminal" | "shortcuts" | "assistant";

const RECENT_LIMIT = 10;

const bump = (list: string[], id: string) =>
  [id, ...list.filter((x) => x !== id)].slice(0, RECENT_LIMIT);

interface WorkspaceState {
  /** Open editor tabs, as document ids, in display order. */
  tabs: string[];
  /** Documents by most recent activation, newest first. Feeds Open Recent and the palette. */
  recent: string[];
  /** Command ids by most recent use, newest first. */
  recentCommands: string[];
  sidebarView: SidebarView;
  sidebarOpen: boolean;
  panelOpen: boolean;
  panelTab: PanelTab;
  /** Explorer folders by key: "" is the workspace root, "projects/archive" a subfolder. */
  expanded: Record<string, boolean>;
  /** The sidebar drawer on phones. Not persisted. */
  drawerOpen: boolean;
  /** Zen mode hides the activity bar, sidebar, panel and status bar. */
  zen: { sidebarOpen: boolean; panelOpen: boolean } | null;
  /** The command palette's text while it is open. A leading ">" means commands. */
  palette: string | null;
  aboutOpen: boolean;
  toast: { id: number; text: string } | null;
  focus: { target: FocusTarget; id: number } | null;
  /** The Search view's query, kept while other views are open. */
  searchQuery: string;

  openTab: (id: string) => void;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  touchRecent: (id: string) => void;
  touchCommand: (id: string) => void;
  /** Activity bar behaviour: clicking the active view hides the sidebar. */
  toggleView: (view: SidebarView) => void;
  showView: (view: SidebarView) => void;
  toggleSidebar: () => void;
  togglePanel: (tab?: PanelTab) => void;
  setPanelTab: (tab: PanelTab) => void;
  closePanel: () => void;
  toggleFolder: (key: string) => void;
  expandFolders: (keys: string[]) => void;
  setDrawerOpen: (open: boolean) => void;
  toggleZen: () => void;
  setPalette: (text: string | null) => void;
  setAboutOpen: (open: boolean) => void;
  notify: (text: string) => void;
  dismissToast: (id: number) => void;
  requestFocus: (target: FocusTarget) => void;
  /** Claims a pending focus request for `target`. True once per request. */
  takeFocus: (target: FocusTarget) => boolean;
  setSearchQuery: (query: string) => void;
}

let nextId = 1;

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      tabs: [],
      recent: [],
      recentCommands: [],
      sidebarView: "explorer",
      sidebarOpen: true,
      panelOpen: false,
      panelTab: "terminal",
      expanded: { "": true, projects: true },
      drawerOpen: false,
      zen: null,
      palette: null,
      aboutOpen: false,
      toast: null,
      focus: null,
      searchQuery: "",

      openTab: (id) => set((s) => (s.tabs.includes(id) ? s : { tabs: [...s.tabs, id] })),
      closeTab: (id) => set((s) => ({ tabs: s.tabs.filter((t) => t !== id) })),
      closeAllTabs: () => set({ tabs: [] }),
      touchRecent: (id) => set((s) => (s.recent[0] === id ? s : { recent: bump(s.recent, id) })),
      touchCommand: (id) => set((s) => ({ recentCommands: bump(s.recentCommands, id) })),
      toggleView: (view) =>
        set((s) =>
          s.sidebarOpen && s.sidebarView === view
            ? { sidebarOpen: false }
            : { sidebarOpen: true, sidebarView: view },
        ),
      showView: (view) => set({ sidebarOpen: true, sidebarView: view }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
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
      // Entering Zen hides the sidebar and panel; leaving it restores them as they were.
      toggleZen: () =>
        set((s) =>
          s.zen
            ? { zen: null, sidebarOpen: s.zen.sidebarOpen, panelOpen: s.zen.panelOpen }
            : {
                zen: { sidebarOpen: s.sidebarOpen, panelOpen: s.panelOpen },
                sidebarOpen: false,
                panelOpen: false,
              },
        ),
      setPalette: (text) => set({ palette: text }),
      setAboutOpen: (open) => set({ aboutOpen: open }),
      notify: (text) => set({ toast: { id: nextId++, text } }),
      dismissToast: (id) => set((s) => (s.toast?.id === id ? { toast: null } : s)),
      requestFocus: (target) => set({ focus: { target, id: nextId++ } }),
      takeFocus: (target) => {
        if (get().focus?.target !== target) return false;
        set({ focus: null });
        return true;
      },
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: "workspace",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        tabs: s.tabs,
        recent: s.recent,
        recentCommands: s.recentCommands,
        sidebarView: s.sidebarView,
        sidebarOpen: s.sidebarOpen,
        panelOpen: s.panelOpen,
        panelTab: s.panelTab,
        expanded: s.expanded,
      }),
      // A session saved with a view or panel tab that no longer exists falls back to the default.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<WorkspaceState>;
        const view = SIDEBAR_VIEWS.find((v) => v === saved.sidebarView) ?? "explorer";
        const panelTab = PANEL_TABS.find((t) => t === saved.panelTab) ?? "terminal";
        return { ...current, ...saved, sidebarView: view, panelTab };
      },
    },
  ),
);
