import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { links } from "@/content/links";
import { projects } from "@/content/projects";
import { known } from "@/content/todo";
import { useIsDesktop } from "@/lib/useMediaQuery";
import { usePreferences } from "@/store/preferences";
import { useTheme } from "@/store/theme";
import { useWorkspace, type SidebarView } from "@/store/workspace";
import { useTerminal } from "@/terminal/store";
import { themes } from "@/themes/themes";
import { docById, type Doc } from "./documents";
import type { KeyCombo } from "./keys";
import { useCloseTab } from "./navigation";

/**
 * Every action the visitor can take from a menu, the palette or a shortcut. Menus, the
 * palette, the keyboard handler and the shortcut reference all read this one list, so a
 * shortcut shown anywhere is a shortcut that works. A command that can't run right now
 * is left out of the list (plan.md 7.1: every item works or is not shown).
 */
export interface Command {
  id: string;
  /** Palette title, with a category like VS Code: "View: Toggle Terminal". */
  title: string;
  /** Menu label. */
  label: string;
  /** The first combo is the one shown. */
  keys?: KeyCombo[];
  /** Fires while typing in a text field too. Off by default (plan.md 7.2). */
  inInputs?: boolean;
  /** Shown as a check mark in menus. */
  checked?: boolean;
  run: () => void;
}

const siteSource = links.others.find((l) => l.label === "Site source")?.href;
const resume = known(links.resume);

/** Projects whose live demo passed its last check (plan.md Decisions log, 2026-10-19). */
const liveDemos = projects.filter((p) => p.links.live && p.liveCheck?.ok);

function subscribeFullscreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}
const isFullscreen = () => document.fullscreenElement !== null;

function download(href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = "";
  a.click();
}

const openExternal = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

export function useCommandList(active: Doc | undefined): Command[] {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const closeTab = useCloseTab(active?.id);
  const tabs = useWorkspace((s) => s.tabs);
  const zen = useWorkspace((s) => s.zen !== null);
  const theme = useTheme((s) => s.theme);
  const fullscreen = useSyncExternalStore(subscribeFullscreen, isFullscreen);

  return useMemo(() => {
    const ws = useWorkspace.getState;

    /** Sidebar views live in a drawer on phones. */
    const showView = (view: SidebarView) => {
      ws().showView(view);
      if (!isDesktop) ws().setDrawerOpen(true);
    };

    const step = (by: number) => {
      const open = ws().tabs;
      const index = active ? open.indexOf(active.id) : -1;
      const next = docById(open[(index + by + open.length) % open.length] ?? "");
      if (next) navigate(next.route);
    };

    const list: (Command | false)[] = [
      // File
      {
        id: "file.open",
        title: "File: Open File...",
        label: "Open File...",
        run: () => ws().setPalette(""),
      },
      !!active && {
        id: "file.closeEditor",
        title: "View: Close Editor",
        label: "Close Editor",
        keys: [{ code: "KeyW", alt: true }],
        run: () => closeTab(active.id),
      },
      tabs.length > 0 && {
        id: "file.closeAll",
        title: "View: Close All Editors",
        label: "Close All Editors",
        run: () => {
          ws().closeAllTabs();
          navigate("/", { state: { closedAll: true } });
        },
      },
      !!resume && {
        id: "file.downloadResume",
        title: "File: Download Resume",
        label: "Download Resume",
        run: () => download(resume),
      },

      // Edit
      {
        id: "edit.find",
        title: "Search: Find in Workspace",
        label: "Find in Workspace",
        run: () => {
          showView("search");
          ws().requestFocus("search");
        },
      },
      !!active && {
        id: "edit.copyLink",
        title: "Edit: Copy Link to This File",
        label: "Copy Link to This File",
        run: () => {
          const url = new URL(active.route, window.location.origin).href;
          navigator.clipboard.writeText(url).then(
            () => ws().notify(`Copied ${url}`),
            () => ws().notify("The browser blocked copying the link."),
          );
        },
      },

      // View
      {
        id: "view.palette",
        title: "View: Command Palette",
        label: "Command Palette...",
        keys: [{ code: "KeyP", mod: true, shift: true }, { code: "F1" }],
        run: () => ws().setPalette(">"),
      },
      {
        id: "view.explorer",
        title: "View: Show Explorer",
        label: "Explorer",
        run: () => showView("explorer"),
      },
      {
        id: "view.search",
        title: "View: Show Search",
        label: "Search",
        keys: [{ code: "KeyF", mod: true, shift: true }],
        run: () => {
          showView("search");
          ws().requestFocus("search");
        },
      },
      {
        id: "view.scm",
        title: "View: Show Source Control",
        label: "Source Control",
        keys: [{ code: "KeyG", mod: true, shift: true }],
        // The view opens with its tab; showing it too covers an already open tab.
        run: () => {
          navigate("/experience");
          ws().showView("scm");
        },
      },
      {
        id: "view.extensions",
        title: "View: Show Extensions",
        label: "Extensions",
        keys: [{ code: "KeyX", mod: true, shift: true }],
        run: () => {
          navigate("/skills");
          ws().showView("extensions");
        },
      },
      {
        id: "view.settings",
        title: "Preferences: Open Settings",
        label: "Settings",
        run: () => showView("settings"),
      },
      {
        id: "view.terminal",
        title: "View: Toggle Terminal",
        label: "Terminal",
        keys: [{ code: "Backquote", ctrl: true }],
        inInputs: true,
        run: () => {
          ws().togglePanel("terminal");
          if (ws().panelOpen) ws().requestFocus("terminal");
        },
      },
      isDesktop && {
        id: "view.toggleSidebar",
        title: "View: Toggle Sidebar",
        label: "Toggle Sidebar",
        keys: [{ code: "KeyB", mod: true }],
        run: () => ws().toggleSidebar(),
      },
      isDesktop && {
        id: "view.zen",
        title: "View: Toggle Zen Mode",
        label: "Zen Mode",
        checked: zen,
        run: () => ws().toggleZen(),
      },
      {
        id: "view.zoomIn",
        title: "View: Zoom In",
        label: "Zoom In",
        run: () => usePreferences.getState().zoomBy(1),
      },
      {
        id: "view.zoomOut",
        title: "View: Zoom Out",
        label: "Zoom Out",
        run: () => usePreferences.getState().zoomBy(-1),
      },
      {
        id: "view.zoomReset",
        title: "View: Reset Zoom",
        label: "Reset Zoom",
        run: () => usePreferences.getState().resetZoom(),
      },
      document.fullscreenEnabled && {
        id: "view.fullscreen",
        title: "View: Toggle Full Screen",
        label: "Full Screen",
        checked: fullscreen,
        run: () => {
          const toggle = isFullscreen()
            ? document.exitFullscreen()
            : document.documentElement.requestFullscreen();
          toggle.catch(() => ws().notify("The browser refused full screen."));
        },
      },

      // Go
      {
        id: "go.file",
        title: "Go to File...",
        label: "Go to File...",
        keys: [{ code: "KeyP", mod: true }],
        run: () => ws().setPalette(""),
      },
      {
        id: "go.project",
        title: "Go to Project...",
        label: "Go to Project...",
        run: () => ws().setPalette("projects/"),
      },
      tabs.length > 1 && {
        id: "go.nextEditor",
        title: "View: Open Next Editor",
        label: "Next Editor",
        keys: [{ code: "BracketRight", alt: true }],
        run: () => step(1),
      },
      tabs.length > 1 && {
        id: "go.previousEditor",
        title: "View: Open Previous Editor",
        label: "Previous Editor",
        keys: [{ code: "BracketLeft", alt: true }],
        run: () => step(-1),
      },
      { id: "go.back", title: "Go: Go Back", label: "Back", run: () => navigate(-1) },
      { id: "go.forward", title: "Go: Go Forward", label: "Forward", run: () => navigate(1) },

      // Terminal
      {
        id: "terminal.new",
        title: "Terminal: Create New Terminal",
        label: "New Terminal",
        run: () => {
          useTerminal.getState().reset();
          if (!ws().panelOpen || ws().panelTab !== "terminal") ws().togglePanel("terminal");
          ws().requestFocus("terminal");
        },
      },
      {
        id: "terminal.clear",
        title: "Terminal: Clear",
        label: "Clear Terminal",
        run: () => useTerminal.getState().clear(),
      },

      // Help
      { id: "help.welcome", title: "Help: Welcome", label: "Welcome", run: () => navigate("/") },
      {
        id: "help.shortcuts",
        title: "Help: Keyboard Shortcuts",
        label: "Keyboard Shortcuts",
        run: () => {
          showView("settings");
          ws().requestFocus("shortcuts");
        },
      },
      !!siteSource && {
        id: "help.source",
        title: "Help: View Source on GitHub",
        label: "View Source on GitHub",
        run: () => openExternal(siteSource),
      },
      {
        id: "help.plain",
        title: "Help: Open Plain View",
        label: "Plain View",
        run: () => navigate("/plain"),
      },
      {
        id: "help.about",
        title: "Help: About",
        label: "About",
        run: () => ws().setAboutOpen(true),
      },

      // Palette only
      ...themes.map((t): Command => ({
        id: `theme.${t.id}`,
        title: `Preferences: Color Theme: ${t.label}`,
        label: t.label,
        checked: theme === t.id,
        run: () => useTheme.getState().setTheme(t.id),
      })),
      ...liveDemos.map((p): Command => ({
        id: `live.${p.slug}`,
        title: `Open ${p.name} live${p.archived ? " (archived)" : ""}`,
        label: `${p.name} live`,
        run: () => openExternal(p.links.live ?? ""),
      })),
    ];
    return list.filter((c): c is Command => c !== false);
  }, [active, closeTab, fullscreen, isDesktop, navigate, tabs.length, theme, zen]);
}

export const CommandsContext = createContext<Command[]>([]);

export const useCommands = () => useContext(CommandsContext);
