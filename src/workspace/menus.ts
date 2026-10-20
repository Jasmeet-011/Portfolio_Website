import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/store/workspace";
import { useCommands, type Command } from "./commands";
import { docById, type Doc } from "./documents";

export type MenuNode =
  | { kind: "command"; command: Command }
  | { kind: "separator" }
  | { kind: "submenu"; label: string; items: MenuNode[] };

export interface MenuDef {
  label: string;
  items: MenuNode[];
}

/** "-" is a separator, "recent" the Open Recent submenu. Ids name commands (commands.ts). */
const LAYOUT: { label: string; items: string[] }[] = [
  {
    label: "File",
    items: [
      "file.open",
      "recent",
      "-",
      "file.closeEditor",
      "file.closeAll",
      "-",
      "file.downloadResume",
    ],
  },
  { label: "Edit", items: ["edit.find", "edit.copyLink"] },
  {
    label: "View",
    items: [
      "view.palette",
      "-",
      "view.explorer",
      "view.search",
      "view.scm",
      "view.extensions",
      "view.settings",
      "-",
      "view.terminal",
      "-",
      "view.toggleSidebar",
      "view.zen",
      "view.fullscreen",
      "-",
      "view.zoomIn",
      "view.zoomOut",
      "view.zoomReset",
    ],
  },
  {
    label: "Go",
    items: [
      "go.file",
      "go.project",
      "-",
      "go.nextEditor",
      "go.previousEditor",
      "-",
      "go.back",
      "go.forward",
    ],
  },
  { label: "Terminal", items: ["terminal.new", "terminal.clear"] },
  {
    label: "Help",
    items: ["help.welcome", "help.shortcuts", "-", "help.source", "help.plain", "-", "help.about"],
  },
  // The Assistant menu (Open Chat, Clear Conversation, Show Trace) arrives in Phase 5.
];

const RECENT_IN_MENU = 5;

/** Drops separators at either end and repeated ones, left behind by hidden commands. */
function tidy(nodes: MenuNode[]): MenuNode[] {
  const out: MenuNode[] = [];
  for (const node of nodes) {
    if (node.kind === "separator" && (out.length === 0 || out.at(-1)?.kind === "separator"))
      continue;
    out.push(node);
  }
  if (out.at(-1)?.kind === "separator") out.pop();
  return out;
}

/** The menu bar's menus. A menu whose commands are all unavailable is left out. */
export function useMenus(): MenuDef[] {
  const commands = useCommands();
  const recent = useWorkspace((s) => s.recent);
  const navigate = useNavigate();

  return useMemo(() => {
    const byId = new Map(commands.filter((c) => c.enabled !== false).map((c) => [c.id, c]));
    const recentItems: MenuNode[] = recent
      .slice(0, RECENT_IN_MENU)
      .map(docById)
      .filter((d): d is Doc => d !== undefined)
      .map((doc) => ({
        kind: "command",
        command: {
          id: `recent.${doc.id}`,
          title: `Open Recent: ${doc.title}`,
          label: doc.path.length ? doc.path.join("/") : doc.title,
          run: () => navigate(doc.route),
        },
      }));

    return LAYOUT.map(({ label, items }) => ({
      label,
      items: tidy(
        items.flatMap((id): MenuNode[] => {
          if (id === "-") return [{ kind: "separator" }];
          if (id === "recent")
            return recentItems.length
              ? [{ kind: "submenu", label: "Open Recent", items: recentItems }]
              : [];
          const command = byId.get(id);
          return command ? [{ kind: "command", command }] : [];
        }),
      ),
    })).filter((menu) => menu.items.length > 0);
  }, [commands, recent, navigate]);
}
