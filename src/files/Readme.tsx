import { links } from "@/content/links";
import { profile } from "@/content/profile";
import { skillCategories, skills } from "@/content/skills";
import { isTodo } from "@/content/todo";
import { WORKSPACE_NAME, type Doc } from "@/workspace/documents";
import { FileView } from "./FileView";
import { Bullets, External, H1, H2, Lead, Open, Page } from "./prose";

/** The README's text, shared by Preview and Source so they never drift apart. */
const intro = [profile.headline, profile.shortBio]
  .filter((v): v is string => !isTodo(v))
  .concat(`${profile.positioning.charAt(0).toUpperCase()}${profile.positioning.slice(1)}.`)
  .slice(0, 2);

const FILES = [
  {
    name: "about.py",
    to: "/about",
    text: "bio, current role, education, certification and publication.",
  },
  {
    name: "projects/",
    to: "/projects/agentguard",
    text: "one file per project: the problem, what I built, results.",
  },
  { name: "contact.http", to: "/contact", text: "a message form, sent as an HTTP request." },
  { name: "Git Graph", to: "/experience", text: "my career as a commit history." },
  { name: "Extensions", to: "/skills", text: "every technology, and where I used it." },
  { name: "Plain view", to: "/plain", text: "everything on one printable page." },
];

const stack = skillCategories
  .map((category) => ({
    category,
    names: skills.filter((s) => s.category === category).map((s) => s.name),
  }))
  .filter((g) => g.names.length > 0);

const LINKS = [
  { label: "GitHub", href: links.github },
  { label: "LinkedIn", href: links.linkedin },
  { label: "Email", href: `mailto:${links.email}` },
  ...links.others,
];

function source(): string {
  return [
    `# ${WORKSPACE_NAME}`,
    "",
    ...intro.flatMap((p) => [p, ""]),
    "## What's in this workspace",
    "",
    ...FILES.map((f) => `- \`${f.name}\`: ${f.text}`),
    "",
    "## Stack",
    "",
    ...stack.map((g) => `- **${g.category}:** ${g.names.join(", ")}`),
    "",
    "## Links",
    "",
    ...LINKS.map((l) => `- [${l.label}](${l.href})`),
    "",
  ].join("\n");
}

function Preview() {
  return (
    <Page>
      <H1>{WORKSPACE_NAME}</H1>
      {intro.map((p) => (
        <Lead key={p}>{p}</Lead>
      ))}
      <H2>What&apos;s in this workspace</H2>
      <Bullets
        items={FILES.map((f) => (
          <>
            <Open to={f.to}>
              <code className="font-mono text-[14px]">{f.name}</code>
            </Open>
            : {f.text}
          </>
        ))}
      />
      <H2>Stack</H2>
      <Bullets
        items={stack.map((g) => (
          <>
            <strong className="font-semibold">{g.category}:</strong> {g.names.join(", ")}
          </>
        ))}
      />
      <H2>Links</H2>
      <Bullets
        items={LINKS.map((l) =>
          l.href.startsWith("mailto:") ? (
            <a href={l.href} className="text-link underline-offset-2 hover:underline">
              {l.label}: {links.email}
            </a>
          ) : (
            <External href={l.href}>{l.label}</External>
          ),
        )}
      />
    </Page>
  );
}

export function Readme({ doc }: { doc: Doc }) {
  return <FileView doc={doc} preview={<Preview />} source={source} />;
}
