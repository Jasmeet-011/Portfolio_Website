import { links } from "@/content/links";
import { profile } from "@/content/profile";
import { skillCategories, skills } from "@/content/skills";
import { isTodo } from "@/content/todo";

/** The README's text, shared by Preview, Source and search so they never drift apart. */
export const intro = [profile.headline, profile.shortBio]
  .filter((v): v is string => !isTodo(v))
  .concat(`${profile.positioning.charAt(0).toUpperCase()}${profile.positioning.slice(1)}.`)
  .slice(0, 2);

export const FILES = [
  {
    name: "about.py",
    to: "/about",
    text: "bio, current role, education, certification and publication.",
  },
  {
    name: "projects/",
    to: "/projects/agentguard",
    text: "one file per project, with the problem, what I built and the results.",
  },
  { name: "contact.http", to: "/contact", text: "a message form, sent as an HTTP request." },
  { name: "Git Graph", to: "/experience", text: "my career as a commit history." },
  { name: "Extensions", to: "/skills", text: "every technology, and where I used it." },
  { name: "Plain view", to: "/plain", text: "everything on one printable page." },
];

export const stack = skillCategories
  .map((category) => ({
    category,
    names: skills.filter((s) => s.category === category).map((s) => s.name),
  }))
  .filter((g) => g.names.length > 0);

export const LINKS = [
  { label: "GitHub", href: links.github },
  { label: "LinkedIn", href: links.linkedin },
  { label: "Email", href: `mailto:${links.email}` },
  ...links.others,
];
