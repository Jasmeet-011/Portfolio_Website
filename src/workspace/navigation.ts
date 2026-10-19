import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIsDesktop } from "@/lib/useMediaQuery";
import { useWorkspace } from "@/store/workspace";
import { docById, type Doc } from "./documents";
import { folderDomId } from "./tree";

/**
 * Navigation state for "every tab is closed". The URL goes back to "/", but the
 * Welcome tab is not reopened until the visitor asks for it.
 */
const CLOSED_ALL = { closedAll: true } as const;

export const isClosedAll = (state: unknown): boolean =>
  typeof state === "object" && state !== null && "closedAll" in state;

/** Closes a tab. Closing the active tab moves to its neighbour, like VS Code. */
export function useCloseTab(activeId: string | undefined) {
  const navigate = useNavigate();
  return useCallback(
    (id: string) => {
      const { tabs, closeTab } = useWorkspace.getState();
      const index = tabs.indexOf(id);
      if (index < 0) return;
      closeTab(id);
      if (id !== activeId) return;
      const remaining = tabs
        .filter((t) => t !== id)
        .map(docById)
        .filter((d): d is Doc => d !== undefined);
      const next = remaining[Math.min(index, remaining.length - 1)];
      if (next) navigate(next.route);
      else navigate("/", { state: CLOSED_ALL });
    },
    [activeId, navigate],
  );
}

/** Opens the explorer at a folder and focuses its row. Used by breadcrumbs. */
export function useRevealFolder() {
  const isDesktop = useIsDesktop();
  return useCallback(
    (key: string) => {
      const ws = useWorkspace.getState();
      const parts = key ? key.split("/") : [];
      ws.expandFolders(["", ...parts.map((_, i) => parts.slice(0, i + 1).join("/"))]);
      if (isDesktop) ws.showView("explorer");
      else ws.setDrawerOpen(true);
      // Wait for the explorer to render before moving focus into it.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => document.getElementById(folderDomId(key))?.focus()),
      );
    },
    [isDesktop],
  );
}
