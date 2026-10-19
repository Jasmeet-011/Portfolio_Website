import { roles } from "./experience";
import { projects } from "./projects";

/**
 * Skills are derived, never listed by hand: a technology appears only if some
 * project or role has it in its `stack`, or a project is written in it (`language`).
 * This file only groups and describes them.
 * A technology missing from `catalog` still appears, under "Other" with no description,
 * so adding a project never requires editing this file.
 */
export type SkillCategory =
  | "Languages"
  | "AI and retrieval"
  | "Backend"
  | "Data stores"
  | "Frontend and mobile"
  | "Blockchain"
  | "APIs and services"
  | "Other";

/** Display order of the categories. */
export const skillCategories: SkillCategory[] = [
  "Languages",
  "AI and retrieval",
  "Backend",
  "Data stores",
  "Frontend and mobile",
  "Blockchain",
  "APIs and services",
  "Other",
];

/** One plain line per technology, describing the technology itself (not Jasmeet). */
const catalog: Record<string, { category: SkillCategory; description: string }> = {
  Python: {
    category: "Languages",
    description:
      "A general-purpose programming language, widely used for backends and machine learning.",
  },
  TypeScript: {
    category: "Languages",
    description: "JavaScript with static types, checked at compile time.",
  },
  JavaScript: {
    category: "Languages",
    description: "The programming language of the web, in browsers and on servers through Node.js.",
  },

  Claude: {
    category: "AI and retrieval",
    description: "Anthropic's family of large language models, used through its API.",
  },
  Gemini: {
    category: "AI and retrieval",
    description: "Google's family of large language models, used through its API.",
  },
  "Gemini Live": {
    category: "AI and retrieval",
    description: "Google's API for real-time voice and video conversations with Gemini.",
  },
  Whisper: {
    category: "AI and retrieval",
    description: "OpenAI's open-source speech recognition model.",
  },
  RAG: {
    category: "AI and retrieval",
    description:
      "Retrieval-augmented generation: a model answers from documents retrieved for each question.",
  },
  BM25: {
    category: "AI and retrieval",
    description: "A keyword ranking function for search that scores documents by term frequency.",
  },
  Evals: {
    category: "AI and retrieval",
    description: "Test sets and metrics that measure how well an LLM system answers.",
  },

  FastAPI: {
    category: "Backend",
    description: "A Python web framework for building typed HTTP APIs.",
  },
  Express: {
    category: "Backend",
    description: "A minimal web framework for Node.js.",
  },
  Celery: {
    category: "Backend",
    description: "A Python task queue that runs work in background workers.",
  },

  MongoDB: {
    category: "Data stores",
    description: "A document database that stores JSON-like records.",
  },
  SQLite: {
    category: "Data stores",
    description: "An embedded SQL database stored in a single file.",
  },
  Qdrant: {
    category: "Data stores",
    description: "A vector database for similarity search over embeddings.",
  },
  Pinecone: {
    category: "Data stores",
    description: "A managed vector database for similarity search.",
  },
  Neo4j: {
    category: "Data stores",
    description: "A graph database queried with the Cypher language.",
  },
  Supabase: {
    category: "Data stores",
    description: "A hosted Postgres platform with auth, storage and generated APIs.",
  },

  React: {
    category: "Frontend and mobile",
    description: "A JavaScript library for building user interfaces from components.",
  },
  "Next.js": {
    category: "Frontend and mobile",
    description: "A React framework with file-based routing and server rendering.",
  },
  "React Native": {
    category: "Frontend and mobile",
    description: "A framework for building native mobile apps with React.",
  },
  Expo: {
    category: "Frontend and mobile",
    description: "A toolkit and platform for building and shipping React Native apps.",
  },
  Streamlit: {
    category: "Frontend and mobile",
    description: "A Python library that turns scripts into interactive web apps.",
  },

  Solana: {
    category: "Blockchain",
    description: "A high-throughput layer 1 blockchain.",
  },
  Aptos: {
    category: "Blockchain",
    description: "A layer 1 blockchain built around the Move language.",
  },

  "Google Cloud Speech-to-Text": {
    category: "APIs and services",
    description: "Google's cloud API that turns recorded speech into text.",
  },
  Twilio: {
    category: "APIs and services",
    description: "A cloud API for sending SMS, voice calls and other messages.",
  },
  "GitHub API": {
    category: "APIs and services",
    description: "GitHub's REST API for repository data such as stars, issues and languages.",
  },
};

export interface SkillUse {
  kind: "project" | "role";
  slug: string;
}

export interface Skill {
  name: string;
  /** URL-safe id, used for /skills#<slug>. */
  slug: string;
  category: SkillCategory;
  description: string | null;
  usedIn: SkillUse[];
}

export const skillSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function deriveSkills(): Skill[] {
  const byName = new Map<string, Skill>();
  const add = (name: string, use: SkillUse) => {
    const entry = catalog[name];
    const skill = byName.get(name) ?? {
      name,
      slug: skillSlug(name),
      category: entry?.category ?? "Other",
      description: entry?.description ?? null,
      usedIn: [],
    };
    if (!skill.usedIn.some((u) => u.kind === use.kind && u.slug === use.slug))
      skill.usedIn.push(use);
    byName.set(name, skill);
  };
  for (const project of projects) {
    const use = { kind: "project", slug: project.slug } as const;
    add(project.language, use);
    for (const name of project.stack) add(name, use);
  }
  for (const role of roles) {
    for (const name of role.stack) add(name, { kind: "role", slug: role.slug });
  }
  return [...byName.values()].sort(
    (a, b) => b.usedIn.length - a.usedIn.length || a.name.localeCompare(b.name),
  );
}

export const skills: Skill[] = deriveSkills();
