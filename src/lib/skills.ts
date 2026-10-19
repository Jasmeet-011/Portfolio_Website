import { roles } from "@/content/experience";
import { projects } from "@/content/projects";
import { skillCategories, skills, type Skill, type SkillUse } from "@/content/skills";

/** Two letters for an extension's icon: "GitHub API" to "GA", "Python" to "Py". */
export function initials(name: string): string {
  const words = name.split(/[\s.]+/).filter(Boolean);
  const [first = "", second = ""] = words;
  return words.length > 1 ? `${first.charAt(0)}${second.charAt(0)}` : name.slice(0, 2);
}

/** Skills grouped by category, in display order, empty categories dropped. */
export const skillGroups = skillCategories
  .map((category) => ({ category, skills: skills.filter((s) => s.category === category) }))
  .filter((g) => g.skills.length > 0);

/** Where a "Used in" chip points, and what it says. */
export function usage(use: SkillUse): { label: string; to: string } | null {
  if (use.kind === "project") {
    const p = projects.find((x) => x.slug === use.slug);
    return p ? { label: p.name, to: `/projects/${p.slug}` } : null;
  }
  const r = roles.find((x) => x.slug === use.slug);
  return r ? { label: `${r.title}, ${r.company}`, to: `/experience#${r.slug}` } : null;
}

export const usedInCount = (skill: Skill): string =>
  `${skill.usedIn.length} ${skill.usedIn.length === 1 ? "place" : "places"}`;
