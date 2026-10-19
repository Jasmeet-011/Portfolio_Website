/**
 * Roles, newest first. Titles, companies and dates come from the resume
 * (plan.md section 10). Dates are "YYYY-MM"; `end: null` means present.
 */
export type RoleKind = "job" | "internship" | "teaching" | "research";

export interface Role {
  slug: string;
  company: string;
  title: string;
  kind: RoleKind;
  start: string;
  end: string | null;
  location?: string;
  summary: string;
  highlights: string[];
  stack: string[];
  url?: string;
}

export const roles: Role[] = [
  {
    slug: "research-engineer-nyu",
    company: "NYU, Prof. Dennis Shasha",
    title: "Research Engineer",
    kind: "research",
    start: "2026-08",
    end: null,
    summary:
      "I test whether a config-first operations engine can take on a logistics vertical without changes to its core.",
    highlights: [],
    stack: ["SQLite"], // The resume names only SQLite for this role.
  },
  {
    slug: "ta-nyu-tandon",
    company: "NYU Tandon",
    title: "Teaching Assistant, Object-Oriented Programming",
    kind: "teaching",
    start: "2025-09",
    end: "2026-05",
    // From the May 2026 resume.
    summary: "I held weekly office hours and reviewed student code for object-oriented design.",
    highlights: [],
    stack: [],
  },
  {
    slug: "qualitest-intern",
    company: "Qualitest",
    title: "Software Engineer Intern",
    kind: "internship",
    start: "2025-06",
    end: "2025-08",
    summary:
      "I worked on the prompts behind an LLM test-case generator and moved its templates into a service that updates without redeploys.",
    // Resume wording, recorded in redesign-v1 commit 2ff9f3d.
    highlights: [
      "Traced about half of the off-scenario steps from COCO's LLM test-case generator to conflicting prompt quotas, and rewrote the prompt.",
      "Built a FastAPI + MongoDB prompt config service for template updates with zero redeploys, and added schema validation to CI that cut manual verification 30%.",
    ],
    stack: ["Python", "FastAPI", "MongoDB"],
  },
];
