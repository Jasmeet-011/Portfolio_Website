import { certifications, degrees, publications } from "@/content/education";
import { roles } from "@/content/experience";
import { links } from "@/content/links";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { skills } from "@/content/skills";
import { known } from "@/content/todo";
import { FILES, intro, LINKS, stack } from "@/files/readmeContent";
import { commitMessage } from "./career";
import { documents, type Doc } from "@/workspace/documents";

/**
 * Full-text search over what each file shows in Preview. Built from src/content (and
 * the README's text module) with the same strings the renderers print, so a match
 * found here can be highlighted in the open file. Adding a project needs no change here.
 */
interface Entry {
  doc: Doc;
  text: string;
}

const docOf = (pred: (d: Doc) => boolean) => documents.find(pred);

function entries(): Entry[] {
  const out: Entry[] = [];
  const add = (doc: Doc | undefined, ...texts: (string | undefined)[]) => {
    if (!doc) return;
    // A string a file shows twice (a language that is also in the stack) counts once.
    for (const text of texts)
      if (text && !out.some((e) => e.doc === doc && e.text === text)) out.push({ doc, text });
  };

  add(
    docOf((d) => d.kind === "readme"),
    ...intro,
    ...FILES.map((f) => f.text),
    ...stack.map((g) => g.names.join(", ")),
    ...LINKS.map((l) => l.label),
  );

  const current = roles.filter((r) => r.end === null);
  add(
    docOf((d) => d.kind === "about"),
    profile.name,
    known(profile.shortBio) ?? known(profile.longBio),
    profile.location,
    ...current.flatMap((r) => [r.title, r.company, r.summary]),
    ...degrees.flatMap((d) => [d.degree, d.school]),
    ...certifications.flatMap((c) => [c.name, c.issuer]),
    ...publications.flatMap((p) => [p.title, p.venue]),
    links.email,
  );

  for (const p of projects) {
    add(
      docOf((d) => d.projectSlug === p.slug),
      p.name,
      p.oneLiner,
      known(p.context),
      known(p.problem),
      ...(known(p.built) ?? []),
      ...(known(p.results) ?? []),
      p.credits?.text,
      p.language,
      ...p.stack,
    );
  }

  add(
    docOf((d) => d.kind === "experience"),
    ...roles.flatMap((r) => [commitMessage(r), r.summary, ...r.highlights]),
    ...degrees.flatMap((d) => [d.degree, d.school]),
    ...certifications.map((c) => c.name),
  );

  add(
    docOf((d) => d.kind === "skills"),
    ...skills.flatMap((s) => [s.name, s.description ?? undefined]),
  );

  return out;
}

const INDEX = entries();

export interface Match {
  /** The whole string the match is in, as the file shows it. */
  text: string;
  /** Where the first occurrence starts in `text`. */
  start: number;
}

export interface FileResult {
  doc: Doc;
  matches: Match[];
  /** Occurrences across the file, counting repeats within one string. */
  count: number;
}

/** Shorter queries match nearly everything. */
export const MIN_QUERY = 2;

/** Case-insensitive substring search, grouped by file: README, about, projects, git graph, extensions. */
export function search(query: string): FileResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY) return [];
  const byDoc = new Map<string, FileResult>();
  for (const { doc, text } of INDEX) {
    const lower = text.toLowerCase();
    const start = lower.indexOf(q);
    if (start < 0) continue;
    const result = byDoc.get(doc.id) ?? { doc, matches: [], count: 0 };
    result.matches.push({ text, start });
    result.count += lower.split(q).length - 1;
    byDoc.set(doc.id, result);
  }
  return [...byDoc.values()];
}

/** Navigation state a search result carries: the query, and the string it was found in. */
export interface FindState {
  find: string;
  text: string;
}

export const findState = (state: unknown): FindState | undefined =>
  typeof state === "object" &&
  state !== null &&
  "find" in state &&
  "text" in state &&
  typeof state.find === "string" &&
  typeof state.text === "string"
    ? { find: state.find, text: state.text }
    : undefined;
