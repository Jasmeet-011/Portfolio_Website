import { GitBranch } from "lucide-react";
import { projects, type Project } from "@/content/projects";
import { skillSlug } from "@/content/skills";
import { known } from "@/content/todo";
import { branchName } from "@/lib/projects";
import type { Doc } from "@/workspace/documents";
import { FileView } from "./FileView";
import { camelCase, js, py, snakeCase, type Value } from "./source/serialize";
import { Bullets, Chip, External, FilePath, H1, H2, Lead, Muted, Page, StatusPill } from "./prose";

/** The project as plain data, Todo fields left out. Shared by every language. */
function data(p: Project): { [key: string]: Value } {
  return {
    name: p.name,
    status: p.status,
    archived: p.archived || undefined,
    branch: p.status === "building" ? branchName(p) : undefined,
    period: known(p.period),
    context: known(p.context),
    stack: p.stack,
    links: { ...p.links },
    problem: known(p.problem),
    built: known(p.built),
    results: known(p.results),
  };
}

function source(p: Project): string {
  const fields = data(p);
  if (p.language === "Python") {
    const name = snakeCase(p.slug);
    const args = Object.entries(fields)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `    ${k}=${py(v, 1)},`);
    return [
      `"""${p.name}: ${p.oneLiner}"""`,
      "",
      "from portfolio import Project",
      "",
      `${name} = Project(`,
      ...args,
      ")",
      "",
    ].join("\n");
  }
  const name = camelCase(p.slug);
  const typed = p.language === "TypeScript";
  return [
    `// ${p.name}: ${p.oneLiner}`,
    ...(typed ? ['import type { Project } from "../portfolio";', ""] : [""]),
    `export const ${name} = ${js(fields)}${typed ? " satisfies Project" : ""};`,
    "",
  ].join("\n");
}

function Preview({ project: p, doc }: { project: Project; doc: Doc }) {
  const built = known(p.built);
  const results = known(p.results);
  const problem = known(p.problem);
  const period = known(p.period);
  const context = known(p.context);
  return (
    <Page>
      <FilePath>{doc.path.join("/")}</FilePath>
      <H1>{p.name}</H1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill status={p.archived ? "archived" : p.status} />
        <Chip>{p.language}</Chip>
        {period && <Muted className="text-sm">{period}</Muted>}
      </div>

      {p.status === "building" && (
        <div className="mt-5 flex gap-3 rounded-md border border-dashed border-border p-4">
          <GitBranch className="mt-1 size-4 shrink-0 text-muted" aria-hidden />
          <p>
            <span className="font-mono text-sm">{branchName(p)}</span> is still being built. Only
            what is listed under What I built exists today.
          </p>
        </div>
      )}
      {p.archived && <Muted className="mt-5">Archived. Kept here for the record.</Muted>}

      <Lead>{p.oneLiner}</Lead>
      {context && <Muted className="mt-2">{context}</Muted>}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
        {p.links.github && <External href={p.links.github}>Code on GitHub</External>}
        {p.links.live && <External href={p.links.live}>Live app</External>}
        {p.links.demo && <External href={p.links.demo}>Demo</External>}
        {p.links.paper && <External href={p.links.paper}>Paper</External>}
      </div>

      {problem && (
        <>
          <H2>Problem</H2>
          <p>{problem}</p>
        </>
      )}
      {built && (
        <>
          <H2>What I built</H2>
          <Bullets items={built} />
        </>
      )}
      {results && (
        <>
          <H2>Results</H2>
          <Bullets items={results} />
        </>
      )}
      <H2>Stack</H2>
      <div className="flex flex-wrap gap-2">
        {[p.language, ...p.stack.filter((s) => s !== p.language)].map((s) => (
          <Chip key={s} to={`/skills#${skillSlug(s)}`}>
            {s}
          </Chip>
        ))}
      </div>
    </Page>
  );
}

export function ProjectFile({ doc }: { doc: Doc }) {
  const project = projects.find((p) => p.slug === doc.projectSlug);
  if (!project) return null;
  return (
    <FileView
      doc={doc}
      preview={<Preview project={project} doc={doc} />}
      source={() => source(project)}
    />
  );
}
