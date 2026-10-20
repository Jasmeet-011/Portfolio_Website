import type { Project, ProjectLinks } from "@/content/projects";

/** The branch a building project lives on, shown wherever it appears. */
export const branchName = (project: Project): string => `feat/${project.slug}`;

/**
 * The links the site shows for a project. A live app appears only while its last check
 * passed (`liveCheck`), so a broken demo is never linked and comes back on its own once
 * a new check passes. Every renderer goes through this.
 */
export function shownLinks(project: Project): ProjectLinks {
  const { live, ...rest } = project.links;
  return live && project.liveCheck?.ok ? { ...rest, live } : rest;
}
