import { roles } from "./experience";
import { projects } from "./projects";

/**
 * Skills are derived, never listed by hand: a technology appears only if some
 * project or role has it in its `stack`. This file only groups them.
 * A technology missing from `categoryOf` still appears, under "Other", so adding
 * a project never requires editing this file.
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

const categoryOf: Record<string, SkillCategory> = {
  Python: "Languages",

  Claude: "AI and retrieval",
  Gemini: "AI and retrieval",
  "Gemini Live": "AI and retrieval",
  Whisper: "AI and retrieval",
  RAG: "AI and retrieval",
  BM25: "AI and retrieval",
  Evals: "AI and retrieval",

  FastAPI: "Backend",
  Express: "Backend",
  Celery: "Backend",

  MongoDB: "Data stores",
  SQLite: "Data stores",
  Qdrant: "Data stores",
  Pinecone: "Data stores",
  Neo4j: "Data stores",
  Supabase: "Data stores",

  React: "Frontend and mobile",
  "Next.js": "Frontend and mobile",
  "React Native": "Frontend and mobile",
  Expo: "Frontend and mobile",
  Streamlit: "Frontend and mobile",

  Solana: "Blockchain",
  Aptos: "Blockchain",

  Twilio: "APIs and services",
  "GitHub API": "APIs and services",
};

export interface SkillUse {
  kind: "project" | "role";
  slug: string;
}

export interface Skill {
  name: string;
  category: SkillCategory;
  usedIn: SkillUse[];
}

function deriveSkills(): Skill[] {
  const byName = new Map<string, Skill>();
  const add = (name: string, use: SkillUse) => {
    const skill = byName.get(name) ?? { name, category: categoryOf[name] ?? "Other", usedIn: [] };
    skill.usedIn.push(use);
    byName.set(name, skill);
  };
  for (const project of projects) {
    for (const name of project.stack) add(name, { kind: "project", slug: project.slug });
  }
  for (const role of roles) {
    for (const name of role.stack) add(name, { kind: "role", slug: role.slug });
  }
  return [...byName.values()].sort(
    (a, b) => b.usedIn.length - a.usedIn.length || a.name.localeCompare(b.name),
  );
}

export const skills: Skill[] = deriveSkills();
