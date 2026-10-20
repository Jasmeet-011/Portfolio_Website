import { roles } from "@/content/experience";
import { links } from "@/content/links";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { known } from "@/content/todo";
import { commitMessage, graphRows } from "@/lib/career";
import { formatMonth, formatRange } from "@/lib/dates";
import { branchName } from "@/lib/projects";
import { skillGroups } from "@/lib/skills";
import { themes, type ThemeId } from "@/themes/themes";
import { documents, type Doc } from "@/workspace/documents";
import { explorerTree, type TreeNode } from "@/workspace/tree";
import type { Segment } from "./store";

/**
 * The terminal's commands (plan.md 7.6). Every line of output is built from
 * src/content, the same data the files and the git graph render.
 */
export interface TerminalContext {
  open: (route: string) => void;
  setTheme: (id: ThemeId) => void;
  currentTheme: ThemeId;
  closePanel: () => void;
  history: string[];
}

type Output = Segment[][];

interface TerminalCommand {
  name: string;
  args?: string;
  description: string;
  run: (args: string[], ctx: TerminalContext) => Output | "clear";
}

const text = (s: string, tone?: Segment["tone"]): Segment => ({ text: s, tone });
const say = (s: string): Output => [[text(s)]];

// The workspace as paths: "about.py", "projects/agentguard.py", and folders with a trailing "/".
const files = documents.filter((d) => d.path.length > 0);
const pathOf = (doc: Doc) => doc.path.join("/");

function findFolder(path: string): TreeNode[] | undefined {
  if (path === "") return explorerTree;
  let nodes = explorerTree;
  for (const name of path.split("/")) {
    const next = nodes.find((n) => n.kind === "folder" && n.name === name);
    if (next?.kind !== "folder") return undefined;
    nodes = next.children;
  }
  return nodes;
}

const folderPaths = (nodes: TreeNode[]): string[] =>
  nodes.flatMap((n) => (n.kind === "folder" ? [`${n.key}/`, ...folderPaths(n.children)] : []));

/** "./projects/", "~/projects" and "projects" are the same folder. */
const normalize = (arg: string) => arg.replace(/^(~\/?|\.\/)+/, "").replace(/\/+$/, "");

/** A file by path, or by name when only one file has it. */
function resolveFile(arg: string): Doc | "folder" | undefined {
  const path = normalize(arg);
  if (path === "" || findFolder(path)) return "folder";
  const exact = files.find((d) => pathOf(d) === path);
  if (exact) return exact;
  const byName = files.filter((d) => d.title === path);
  return byName.length === 1 ? byName[0] : undefined;
}

/** Pads columns so a table lines up in a monospace font. */
function table(rows: Segment[][]): Output {
  const widths: number[] = [];
  for (const row of rows)
    row.forEach((cell, i) => (widths[i] = Math.max(widths[i] ?? 0, cell.text.length)));
  return rows.map((row) =>
    row.flatMap((cell, i) =>
      i === row.length - 1
        ? [cell]
        : [cell, text(" ".repeat((widths[i] ?? 0) - cell.text.length + 2))],
    ),
  );
}

const current = roles.find((r) => r.end === null);
const resume = known(links.resume);

const COMMANDS: TerminalCommand[] = [
  {
    name: "help",
    description: "list commands",
    run: () => [
      ...table(
        COMMANDS.map((c) => [
          text(c.args ? `${c.name} ${c.args}` : c.name),
          text(c.description, "muted"),
        ]),
      ),
      [text("Tab completes commands and file names. Up and down walk through history.", "muted")],
    ],
  },
  {
    name: "whoami",
    description: "who I am, in one line",
    run: () =>
      say(
        `${profile.name}, ${profile.positioning}${current ? `. Now: ${current.title}, ${current.company}` : ""}.`,
      ),
  },
  {
    name: "ls",
    args: "[folder]",
    description: "list files, e.g. ls projects",
    run: ([arg = ""]) => {
      const path = normalize(arg);
      const nodes = findFolder(path);
      if (!nodes) {
        const doc = resolveFile(arg);
        return doc && doc !== "folder"
          ? [[{ text: pathOf(doc), tone: "link", to: doc.route }]]
          : say(`ls: cannot access '${arg}': No such file or directory`);
      }
      return [
        nodes.flatMap((n, i) => [
          ...(i > 0 ? [text("  ")] : []),
          n.kind === "folder"
            ? text(`${n.name}/`, "tag")
            : { text: n.name, tone: "link" as const, to: n.doc.route },
        ]),
      ];
    },
  },
  {
    name: "open",
    args: "<file>",
    description: "open a file in a tab (cat works too)",
    run: (args, ctx) => openFile("open", args, ctx),
  },
  {
    name: "projects",
    description: "every project and its status",
    run: () =>
      table([
        [text("NAME", "muted"), text("FILE", "muted"), text("STATUS", "muted")],
        ...projects.map((p) => {
          const doc = documents.find((d) => d.projectSlug === p.slug);
          const status = p.archived
            ? "archived"
            : p.status === "building"
              ? `building on ${branchName(p)}`
              : "shipped";
          return [
            text(p.name),
            doc ? { text: pathOf(doc), tone: "link" as const, to: doc.route } : text(""),
            text(status, p.status === "building" && !p.archived ? "tag" : undefined),
          ];
        }),
      ]),
  },
  {
    name: "git",
    args: "log",
    description: "my career as a commit history",
    run: ([sub]) => {
      if (sub !== "log") return say('git: only "git log" works here.');
      return graphRows.map((row, i) => {
        const head = i === 0 ? [text("(HEAD -> main) ", "comment")] : [];
        if (row.type === "commit")
          return [
            text(`${row.hash} `, "muted"),
            ...head,
            { text: commitMessage(row.role), to: `/experience#${row.slug}` },
            text(`  ${formatRange(row.role.start, row.role.end)}`, "muted"),
          ];
        return [
          text(`${row.hash} `, "muted"),
          ...head,
          text(`(tag: ${row.slug}) `, "tag"),
          { text: `${row.degree.degree}, ${row.degree.school}`, to: `/experience#${row.slug}` },
          text(`  ${formatMonth(row.degree.end)}`, "muted"),
        ];
      });
    },
  },
  {
    name: "skills",
    description: "technologies, grouped",
    run: () =>
      table(
        skillGroups.map((g) => [
          text(g.category, "muted"),
          text(g.skills.map((s) => s.name).join(", ")),
        ]),
      ),
  },
  {
    name: "contact",
    description: "email and links",
    run: () => [
      ...table([
        [text("email", "muted"), { text: links.email, href: `mailto:${links.email}` }],
        [text("github", "muted"), { text: links.github, href: links.github }],
        [text("linkedin", "muted"), { text: links.linkedin, href: links.linkedin }],
      ]),
      [
        text("Or send a message from "),
        { text: "contact.http", tone: "link", to: "/contact" },
        text("."),
      ],
    ],
  },
  ...(resume
    ? [
        {
          name: "resume",
          description: "download my resume",
          run: () => {
            const a = document.createElement("a");
            a.href = resume;
            a.download = "";
            a.click();
            return say("Downloading resume.pdf");
          },
        } satisfies TerminalCommand,
      ]
    : []),
  {
    name: "theme",
    args: "[name]",
    description: "list themes, or switch to one",
    run: ([arg], ctx) => {
      if (!arg)
        return themes.map((t) => [
          text(t.id === ctx.currentTheme ? "* " : "  ", "comment"),
          text(t.id),
          text(`  ${t.label}`, "muted"),
        ]);
      const wanted = arg.toLowerCase();
      const theme = themes.find(
        (t) => t.id === wanted || t.label.toLowerCase().replace(/\s+/g, "-") === wanted,
      );
      if (!theme) return say(`theme: no theme named '${arg}'. Run theme to list them.`);
      ctx.setTheme(theme.id);
      return say(`Theme: ${theme.label}`);
    },
  },
  { name: "clear", description: "clear the terminal", run: () => "clear" },
  {
    name: "history",
    description: "commands you've run",
    run: (_, ctx) =>
      ctx.history.map((h, i) => [text(String(i + 1).padStart(4, " "), "muted"), text(`  ${h}`)]),
  },
  {
    name: "exit",
    description: "close the panel",
    run: (_, ctx) => {
      ctx.closePanel();
      return [];
    },
  },
];

/** cat is open under another name, as plan.md 7.6 asks; help lists it with open. */
const ALIASES: Record<string, string> = { cat: "open" };

function openFile(name: string, [arg]: string[], ctx: TerminalContext): Output {
  if (!arg) return say(`usage: ${name} <file>`);
  const doc = resolveFile(arg);
  if (doc === "folder") return say(`${name}: ${arg}: Is a directory`);
  if (!doc) return say(`${name}: ${arg}: No such file`);
  ctx.open(doc.route);
  return [[text("Opened "), { text: pathOf(doc), tone: "link", to: doc.route }]];
}

export function execute(input: string, ctx: TerminalContext): Output | "clear" {
  const [word = "", ...args] = input.trim().split(/\s+/);
  if (!word) return [];
  if (ALIASES[word]) return openFile(word, args, ctx);
  const command = COMMANDS.find((c) => c.name === word);
  if (!command) return say(`command not found: ${word}. Try help.`);
  return command.run(args, ctx);
}

const commonPrefix = (words: string[]) =>
  words.reduce((prefix, w) => {
    let i = 0;
    while (i < prefix.length && prefix[i] === w[i]) i++;
    return prefix.slice(0, i);
  });

/** Candidates for the word being typed, given the command before it. */
function candidates(command: string | undefined, partial: string): string[] {
  if (command === undefined) return [...COMMANDS.map((c) => c.name), ...Object.keys(ALIASES)];
  const folders = folderPaths(explorerTree);
  switch (ALIASES[command] ?? command) {
    case "open":
      // Full paths once a "/" is typed, otherwise the top level plus file names.
      return partial.includes("/")
        ? [...files.map(pathOf), ...folders]
        : [
            ...explorerTree.map((n) => (n.kind === "folder" ? `${n.name}/` : n.name)),
            ...files.filter((d) => d.path.length > 1).map((d) => d.title),
          ];
    case "ls":
      return folders;
    case "theme":
      return themes.map((t) => t.id);
    case "git":
      return ["log"];
    default:
      return [];
  }
}

/**
 * Tab completion. One match completes the word; several complete their shared
 * prefix, or come back as options to print when there is nothing more to add.
 */
export function complete(input: string): { value: string; options: string[] } {
  const words = input.split(" ");
  const partial = words.at(-1) ?? "";
  const command = words.length > 1 ? words[0] : undefined;
  const matches = [...new Set(candidates(command, partial))]
    .filter((c) => c.startsWith(partial))
    .sort();
  const replaceLast = (word: string) => [...words.slice(0, -1), word].join(" ");
  const [only] = matches;
  if (matches.length === 0 || only === undefined) return { value: input, options: [] };
  if (matches.length === 1)
    return { value: replaceLast(only.endsWith("/") ? only : `${only} `), options: [] };
  const prefix = commonPrefix(matches);
  if (prefix.length > partial.length) return { value: replaceLast(prefix), options: [] };
  return { value: input, options: matches };
}

export const PROMPT: Segment[] = [text("jasmeet@portfolio", "link"), text(":~$ ", "muted")];
