import { links } from "@/content/links";
import { WORKSPACE_NAME, type Doc } from "@/workspace/documents";
import { FileView } from "./FileView";
import { Bullets, External, H1, H2, Lead, Open, Page } from "./prose";
import { FILES, intro, LINKS, stack } from "./readmeContent";

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
              <code className="font-mono text-[15px]">{f.name}</code>
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
