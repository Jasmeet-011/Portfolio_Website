import type { Project } from "@/content/projects";

/** The branch a building project lives on, shown wherever it appears. */
export const branchName = (project: Project): string => `feat/${project.slug}`;
