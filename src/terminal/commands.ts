import { certifications, degrees, publications } from "@/content/education";
import { roles } from "@/content/experience";
import { links } from "@/content/links";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { skills } from "@/content/skills";
import { known } from "@/content/todo";
import { buildInfo } from "@/lib/buildInfo";
import { commitMessage, graphRows } from "@/lib/career";
import { formatMonth, formatRange } from "@/lib/dates";
import { branchName, shownLinks } from "@/lib/projects";
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
  /** Opens a workspace route in a tab. */
  open: (route: string) => void;
  /** Opens a page outside the site (or a mailto: link). */
  openExternal: (href: string) => void;
  now: () => Date;
  /** Characters that fit on one line, so wide output can fall back to a narrow layout. */
  columns: number;
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
const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** Places outside the site that open accepts by name. */
const NAMED_LINKS: Record<string, { href: string; label: string }> = {
  github: { href: links.github, label: bare(links.github) },
  linkedin: { href: links.linkedin, label: bare(links.linkedin) },
  email: { href: `mailto:${links.email}`, label: links.email },
};

/**
 * A named link, or a project by slug: its live app while the last check passed,
 * otherwise its code on GitHub.
 */
function linkFor(arg: string): { href: string; label: string } | undefined {
  const key = arg.toLowerCase();
  const named = NAMED_LINKS[key];
  if (named) return named;
  const project = projects.find((p) => p.slug === key);
  if (!project) return undefined;
  const { live, github } = shownLinks(project);
  if (live) return { href: live, label: `${project.name} live app, ${bare(live)}` };
  return github ? { href: github, label: `${project.name} on GitHub, ${bare(github)}` } : undefined;
}

/** "JW" in figlet's standard font. */
const ART = [
  "     _ __        __",
  "    | |\\ \\      / /",
  " _  | | \\ \\ /\\ / /",
  "| |_| |  \\ V  V /",
  " \\___/    \\_/\\_/",
];
const ART_WIDTH = Math.max(...ART.map((l) => l.length)) + 3;

function neofetch(ctx: TerminalContext): Output {
  const key = (k: string) => text(`${k}:`.padEnd(11), "comment");
  const info: Segment[][] = [
    [text("jasmeet@portfolio", "link")],
    [text("-".repeat(17), "muted")],
    [key("Name"), text(profile.name)],
    [key("Location"), text(profile.location)],
    [key("Focus"), text(profile.positioning)],
    ...(current ? [[key("Now"), text(`${current.title}, ${current.company}`)]] : []),
    [
      key("Top stack"),
      text(
        skills
          .slice(0, 6)
          .map((s) => s.name)
          .join(", "),
      ),
    ],
    [key("GitHub"), { text: bare(links.github), href: links.github }],
    [key("LinkedIn"), { text: bare(links.linkedin), href: links.linkedin }],
    [key("Email"), { text: links.email, href: `mailto:${links.email}` }],
    [key("Site"), text(`${buildInfo.version} (${buildInfo.commit})`)],
  ];
  // Side by side like neofetch when there is room, art above the card when there isn't.
  if (ctx.columns < ART_WIDTH + 60)
    return [...ART.map((l) => [text(l, "link")]), [text("")], ...info];
  return Array.from({ length: Math.max(ART.length, info.length) }, (_, i) => [
    text((ART[i] ?? "").padEnd(ART_WIDTH), "link"),
    ...(info[i] ?? []),
  ]);
}

/** "Mon Oct 19 22:31:05 2026", like date on a Unix shell. */
function unixDate(d: Date): string {
  const [weekday, month, day, year] = d.toDateString().split(" ");
  return `${weekday} ${month} ${day} ${d.toTimeString().slice(0, 8)} ${year}`;
}

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
    name: "neofetch",
    description: "who I am, as a system info card",
    run: (_, ctx) => neofetch(ctx),
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
    args: "<file|link>",
    description: "open a file, or github, linkedin, email or a project",
    run: (args, ctx) => openTarget(args, ctx),
  },
  {
    name: "cat",
    args: "<file>",
    description: "open a file in a tab",
    run: (args, ctx) => openFile("cat", args, ctx),
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
    name: "education",
    description: "my degrees",
    run: () =>
      table(
        degrees.map((d) => [
          text(d.degree),
          text(d.school),
          text(formatRange(d.start, d.end), "muted"),
          text(d.grade, "muted"),
        ]),
      ),
  },
  {
    name: "certs",
    description: "certification and publication",
    run: () => [
      [text("Certification", "comment")],
      ...certifications.map((c) => {
        const earned = known(c.earned);
        return [
          text("  "),
          { text: c.name, href: c.url },
          text(`  ${c.issuer}${earned ? `, ${formatMonth(earned)}` : ""}`, "muted"),
        ];
      }),
      [text("")],
      [text("Publication", "comment")],
      ...publications.flatMap((p) => [
        [text("  "), { text: p.title, href: p.url }],
        [text(`  ${p.venue}`, "muted")],
      ]),
    ],
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
  {
    name: "echo",
    args: "[text]",
    description: "print text",
    run: (args) => say(args.join(" ").replace(/^(["'])(.*)\1$/, "$2")),
  },
  { name: "date", description: "the date and time", run: (_, ctx) => say(unixDate(ctx.now())) },
  { name: "pwd", description: "where you are", run: () => say("/home/jasmeet") },
  { name: "clear", description: "clear the terminal", run: () => "clear" },
  {
    name: "history",
    description: "commands you've run",
    run: (_, ctx) =>
      ctx.history.map((h, i) => [text(String(i + 1).padStart(4, " "), "muted"), text(`  ${h}`)]),
  },
  {
    name: "sudo",
    args: "<command>",
    description: "try it",
    run: () =>
      say("Nice try. You're not in the sudoers file, but you can still reach me: try contact."),
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

/** open: a file, then a named link or project, in that order. */
function openTarget([arg]: string[], ctx: TerminalContext): Output {
  if (!arg) return say("usage: open <file|github|linkedin|email|project>");
  const doc = resolveFile(arg);
  if (doc && doc !== "folder") return openFile("open", [arg], ctx);
  const link = linkFor(arg);
  if (link) {
    ctx.openExternal(link.href);
    return [[text("Opening "), { text: link.label, href: link.href }]];
  }
  if (doc === "folder") return say(`open: ${arg}: Is a directory`);
  return say(`open: ${arg}: No such file or link`);
}

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
  if (command === undefined) return COMMANDS.map((c) => c.name);
  const folders = folderPaths(explorerTree);
  // Full paths once a "/" is typed, otherwise the top level plus file names.
  const filePaths = partial.includes("/")
    ? [...files.map(pathOf), ...folders]
    : [
        ...explorerTree.map((n) => (n.kind === "folder" ? `${n.name}/` : n.name)),
        ...files.filter((d) => d.path.length > 1).map((d) => d.title),
      ];
  switch (command) {
    case "cat":
      return filePaths;
    case "open":
      return [...filePaths, ...Object.keys(NAMED_LINKS), ...projects.map((p) => p.slug)];
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
