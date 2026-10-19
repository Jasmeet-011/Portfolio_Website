import { degrees, type Degree } from "@/content/education";
import { roles, type Role, type RoleKind } from "@/content/experience";
import { sha1 } from "./sha1";

/**
 * The career as a git history (plan.md section 6): roles sorted by start date are
 * commits (short hash = first 7 characters of sha1(slug), message "title @ company"),
 * lanes follow the role's kind, and degrees are tags on main at their end date.
 * Certifications are listed under the graph: one has no date yet, so it cannot be placed.
 */
export const shortHash = (slug: string): string => sha1(slug).slice(0, 7);

export const commitMessage = (role: Role): string => `${role.title} @ ${role.company}`;

export type GraphRow =
  | { type: "commit"; slug: string; date: string; hash: string; role: Role; lane: number }
  | { type: "tag"; slug: string; date: string; hash: string; degree: Degree };

const LANE_ORDER: RoleKind[] = ["research", "teaching", "internship", "job"];

/** Lane 0 is main. Each role kind present gets its own lane, in LANE_ORDER. */
export const laneKinds: RoleKind[] = LANE_ORDER.filter((k) => roles.some((r) => r.kind === k));
export const laneOfKind = (kind: RoleKind): number => laneKinds.indexOf(kind) + 1;
export const laneCount = laneKinds.length + 1;

/** Newest first. */
export const graphRows: GraphRow[] = [
  ...roles.map((role): GraphRow => ({
    type: "commit",
    slug: role.slug,
    date: role.start,
    hash: shortHash(role.slug),
    role,
    lane: laneOfKind(role.kind),
  })),
  ...degrees.map((degree): GraphRow => ({
    type: "tag",
    slug: degree.slug,
    date: degree.end,
    hash: shortHash(degree.slug),
    degree,
  })),
].sort((a, b) => b.date.localeCompare(a.date));

/**
 * Where a role's branch merges back into main: the nearest newer row dated at or
 * after the role's end, or -1 when it is ongoing (the lane runs to the top).
 */
export function mergeRow(index: number): number {
  const row = graphRows[index];
  if (row?.type !== "commit" || row.role.end === null) return -1;
  const end = row.role.end;
  for (let i = index - 1; i >= 0; i--) {
    if ((graphRows[i]?.date ?? "") >= end) return i;
  }
  return -1;
}
