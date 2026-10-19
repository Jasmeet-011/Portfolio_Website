import { links } from "@/content/links";
import { projects } from "@/content/projects";
import { isTodo } from "@/content/todo";
import type { SidebarView } from "@/store/workspace";

export const WORKSPACE_NAME = "jasmeet-wadhwa";

export type DocKind =
  "welcome" | "readme" | "about" | "project" | "contact" | "resume" | "experience" | "skills";

export type DocIcon =
  "py" | "ts" | "js" | "md" | "http" | "pdf" | "welcome" | "graph" | "extensions";

/** Anything the visitor can open in a tab. Every document has its own URL. */
export interface Doc {
  id: string;
  kind: DocKind;
  /** Tab label. */
  title: string;
  route: string;
  /** Path inside the workspace, e.g. ["projects", "agentguard.py"]. Empty for views. */
  path: readonly string[];
  /** Status bar language mode, or null to hide it. */
  language: string | null;
  icon: DocIcon;
  /** Sidebar view to reveal when this document opens. */
  view?: SidebarView;
  projectSlug?: string;
}

const TYPE_BY_EXTENSION: Record<string, { language: string; icon: DocIcon }> = {
  py: { language: "Python", icon: "py" },
  ts: { language: "TypeScript", icon: "ts" },
  js: { language: "JavaScript", icon: "js" },
  md: { language: "Markdown", icon: "md" },
  http: { language: "HTTP", icon: "http" },
  pdf: { language: "PDF", icon: "pdf" },
};

function file(kind: DocKind, route: string, path: string[], extra: Partial<Doc> = {}): Doc {
  const name = path.at(-1) ?? route;
  const type = TYPE_BY_EXTENSION[name.split(".").pop() ?? ""] ?? { language: null, icon: "md" };
  return { id: path.join("/"), kind, title: name, route, path, ...type, ...extra };
}

export const documents: Doc[] = [
  {
    id: "welcome",
    kind: "welcome",
    title: "Welcome",
    route: "/",
    path: [],
    language: null,
    icon: "welcome",
  },
  file("readme", "/readme", ["README.md"]),
  file("about", "/about", ["about.py"]),
  ...projects.map((p) =>
    file(
      "project",
      `/projects/${p.slug}`,
      p.archived ? ["projects", "archive", p.fileName] : ["projects", p.fileName],
      { projectSlug: p.slug },
    ),
  ),
  file("contact", "/contact", ["contact.http"]),
  // resume.pdf appears only once public/resume.pdf exists (plan.md 7.1: works or is not shown).
  ...(isTodo(links.resume) ? [] : [file("resume", "/resume", ["resume.pdf"])]),
  {
    id: "git-graph",
    kind: "experience",
    title: "Git Graph",
    route: "/experience",
    path: [],
    language: null,
    icon: "graph",
    view: "scm",
  },
  {
    id: "extensions",
    kind: "skills",
    title: "Extensions",
    route: "/skills",
    path: [],
    language: null,
    icon: "extensions",
    view: "extensions",
  },
];

const byId = new Map(documents.map((d) => [d.id, d]));
const byRoute = new Map(documents.map((d) => [d.route, d]));

export const docById = (id: string): Doc | undefined => byId.get(id);

export function docForPath(pathname: string): Doc | undefined {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return byRoute.get(normalized);
}

/** DOM id of a document's tab, for aria-labelledby. */
export const tabDomId = (doc: Doc): string => `tab-${doc.id.replace(/[^\w-]/g, "-")}`;
