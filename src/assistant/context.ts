import { certifications, degrees, publications } from "@/content/education";
import { roles } from "@/content/experience";
import { links } from "@/content/links";
import { profile } from "@/content/profile";
import { projects, type Project } from "@/content/projects";
import { known } from "@/content/todo";
import { formatMonth, formatRange } from "@/lib/dates";
import { branchName, shownLinks } from "@/lib/projects";
import { skillGroups, usage } from "@/lib/skills";
import { documents } from "@/workspace/documents";

/**
 * The assistant's grounding (plan.md 7.7): everything in src/content as small chunks.
 * scripts/build-copilot-context.mjs writes these into api/_generated/context.ts for the
 * server; the browser uses the same chunks to turn cited chunk ids into source chips.
 *
 * Only what the site shows goes in: Todo fields are left out, and so is any live link
 * whose last check failed (shownLinks).
 */
export interface Chunk {
  /** "<file or view>#<section>", e.g. "projects/agentguard.py#built". */
  id: string;
  /** Source chip label, e.g. "agentguard.py › What I built". */
  label: string;
  /** Where the chip goes: the file's route plus the section's anchor. */
  route: string;
  text: string;
}

export interface Suggestion {
  id: string;
  question: string;
}

const lines = (...parts: (string | false | undefined | null)[]) =>
  parts.filter((p): p is string => typeof p === "string" && p !== "").join("\n");

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

function projectChunks(p: Project): Chunk[] {
  const doc = documents.find((d) => d.projectSlug === p.slug);
  if (!doc) return [];
  const path = doc.path.join("/");
  const route = doc.route;
  const file = doc.title;
  const link = shownLinks(p);
  const status = p.archived
    ? "archived (kept for the record)"
    : p.status === "building"
      ? `building, on branch ${branchName(p)}. It is not finished: only what is listed under What I built exists today.`
      : "shipped";
  const out: Chunk[] = [
    {
      id: `${path}#overview`,
      label: file,
      route,
      text: lines(
        `Project: ${p.name} (file ${path})`,
        `Status: ${status}`,
        `Main language: ${p.language}`,
        known(p.period) && `Dates: ${known(p.period)}`,
        `Summary: ${p.oneLiner}`,
        known(p.context) && `Context: ${known(p.context)}`,
        `Stack: ${[p.language, ...p.stack.filter((s) => s !== p.language)].join(", ")}`,
        link.github && `Code: ${link.github}`,
        link.live && `Live app: ${link.live}`,
        link.demo && `Demo: ${link.demo}`,
        link.paper && `Paper: ${link.paper}`,
        p.credits && `Credit to others (not Jasmeet's work): ${p.credits.text}`,
      ),
    },
  ];
  const problem = known(p.problem);
  if (problem)
    out.push({
      id: `${path}#problem`,
      label: `${file} › Problem`,
      route: `${route}#problem`,
      text: lines(`${p.name}, the problem it solves:`, problem),
    });
  const built = known(p.built);
  if (built)
    out.push({
      id: `${path}#built`,
      label: `${file} › What I built`,
      route: `${route}#built`,
      text: lines(`${p.name}, what Jasmeet built:`, bullets(built)),
    });
  const results = known(p.results);
  if (results)
    out.push({
      id: `${path}#results`,
      label: `${file} › Results`,
      route: `${route}#results`,
      text: lines(`${p.name}, results:`, bullets(results)),
    });
  return out;
}

export function buildChunks(): Chunk[] {
  const current = roles.filter((r) => r.end === null);
  const bio = known(profile.shortBio) ?? known(profile.longBio);
  return [
    {
      id: "about.py#profile",
      label: "about.py",
      route: "/about",
      text: lines(
        `Name: ${profile.name}`,
        `Focus: ${profile.positioning}`,
        known(profile.headline) && `Headline: ${known(profile.headline)}`,
        bio && `Bio: ${bio}`,
        `Location: ${profile.location}`,
        `Email: ${links.email}`,
        `GitHub: ${links.github}`,
        `LinkedIn: ${links.linkedin}`,
        "Contact form: contact.http in this workspace sends him a message.",
      ),
    },
    {
      id: "about.py#now",
      label: "about.py › Now",
      route: "/about#now",
      text: lines(
        "What Jasmeet is doing now:",
        bullets(
          current.map(
            (r) => `${r.title} at ${r.company}, since ${formatMonth(r.start)}. ${r.summary}`,
          ),
        ),
      ),
    },
    ...roles.map((r): Chunk => ({
      id: `git-graph#${r.slug}`,
      label: `Git Graph › ${r.title}`,
      route: `/experience#${r.slug}`,
      text: lines(
        `Role: ${r.title}`,
        `Organization: ${r.company}`,
        `Kind: ${r.kind}`,
        `Dates: ${formatRange(r.start, r.end)}`,
        r.location && `Location: ${r.location}`,
        `Summary: ${r.summary}`,
        r.highlights.length > 0 && `Highlights:\n${bullets(r.highlights)}`,
        r.stack.length > 0 && `Stack: ${r.stack.join(", ")}`,
      ),
    })),
    {
      id: "about.py#education",
      label: "about.py › Education",
      route: "/about#education",
      text: lines(
        "Education:",
        bullets(
          degrees.map(
            (d) => `${d.degree}, ${d.school}, ${formatRange(d.start, d.end)}, ${d.grade}`,
          ),
        ),
      ),
    },
    {
      id: "about.py#certification",
      label: "about.py › Certification",
      route: "/about#certification",
      text: lines(
        "Certifications (this is the complete list):",
        bullets(
          certifications.map((c) => {
            const earned = known(c.earned);
            return `${c.name}, ${c.issuer}${earned ? `, ${formatMonth(earned)}` : ""}. Badge: ${c.url}`;
          }),
        ),
      ),
    },
    {
      id: "about.py#publication",
      label: "about.py › Publication",
      route: "/about#publication",
      text: lines(
        "Publications:",
        bullets(publications.map((p) => `"${p.title}", ${p.venue}. ${p.url}`)),
      ),
    },
    ...projects.flatMap(projectChunks),
    {
      id: "extensions#skills",
      label: "Extensions",
      route: "/skills",
      text: lines(
        "Skills, by category, with where each was used:",
        ...skillGroups.map(
          (g) =>
            `${g.category}: ${g.skills
              .map((s) => {
                const used = s.usedIn.map((u) => usage(u)?.label).filter(Boolean);
                return `${s.name} (${used.join(", ")})`;
              })
              .join("; ")}`,
        ),
      ),
    },
  ];
}

/**
 * Suggested question chips, from content: what Jasmeet is doing now, then each featured
 * project. Archived projects never appear (plan.md 7.7).
 */
export function buildSuggestions(): Suggestion[] {
  const out: Suggestion[] = [];
  if (roles.some((r) => r.end === null))
    out.push({ id: "now", question: "What is Jasmeet working on now?" });
  for (const p of projects.filter((x) => x.featured && !x.archived))
    out.push({
      id: `project-${p.slug}`,
      question:
        p.status === "building"
          ? `What is done so far on ${p.name}?`
          : `What did Jasmeet build in ${p.name}?`,
    });
  return out;
}
