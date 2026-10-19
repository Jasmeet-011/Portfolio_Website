import {
  BookOpen,
  Download,
  FileText,
  FolderOpen,
  GitBranch,
  GitGraph,
  Send,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { FileIcon } from "@/assets/file-icons/FileIcon";
import { roles } from "@/content/experience";
import { links } from "@/content/links";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { known } from "@/content/todo";
import { branchName } from "@/lib/projects";
import { documents } from "@/workspace/documents";
import { useRevealFolder } from "@/workspace/navigation";
import { StatusPill } from "./prose";

const current = roles.filter((r) => r.end === null);
const visible = projects.filter((p) => p.featured && !p.archived);
const featured = visible.filter((p) => p.status === "shipped");
const building = visible.filter((p) => p.status === "building");
const docFor = (slug: string) => documents.find((d) => d.projectSlug === slug);

const space = profile.name.lastIndexOf(" ");
const givenNames = profile.name.slice(0, space);
const surname = profile.name.slice(space + 1);
const resume = known(links.resume);

function Heading({ children, id }: { children: ReactNode; id: string }) {
  return (
    <h2 id={id} className="mb-3 text-[17px] font-semibold">
      {children}
    </h2>
  );
}

const actionClass =
  "group flex items-center gap-3 rounded px-2 py-1.5 -mx-2 text-link hover:bg-hover";

function Action({
  icon: Icon,
  label,
  hint,
  to,
  href,
  onClick,
  download,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  download?: boolean;
}) {
  const body = (
    <>
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
      {hint && <span className="font-mono text-xs text-muted">{hint}</span>}
    </>
  );
  return (
    <li>
      {to ? (
        <Link to={to} className={actionClass}>
          {body}
        </Link>
      ) : href ? (
        <a href={href} download={download} className={actionClass}>
          {body}
        </a>
      ) : (
        <button type="button" onClick={onClick} className={actionClass}>
          {body}
        </button>
      )}
    </li>
  );
}

/** The landing page: who Jasmeet is, where to start, featured work, and what is in progress. */
export function Welcome() {
  const reveal = useRevealFolder();
  return (
    <div className="px-6 py-10 sm:px-10 lg:px-14">
      <header className="max-w-[72ch]">
        {/* Always one line: plan.md section 3 rules out a name split over two lines with the
            second line in an accent color. Fluid size keeps it on one line down to 320px. */}
        <h1 className="font-mono text-[clamp(1.25rem,6.6vw,2.5rem)] leading-tight font-semibold whitespace-nowrap">
          {givenNames} <span className="text-highlight">{surname}</span>
        </h1>
        <p className="mt-3 font-mono text-[14px] text-comment">
          {"// "}
          {profile.positioning}
        </p>
        {current.map((r) => (
          <p key={r.slug} className="mt-3 text-[17px]">
            {r.title}, {r.company}
          </p>
        ))}
        {known(profile.headline) && <p className="mt-2 text-[17px]">{known(profile.headline)}</p>}
        <Link
          to="/plain"
          className="mt-6 inline-flex h-10 items-center rounded bg-accent px-4 text-[15px] font-medium text-on-accent hover:brightness-110 md:hidden"
        >
          Read the plain view
        </Link>
      </header>

      <div className="mt-10 grid max-w-6xl gap-x-16 gap-y-10 lg:grid-cols-2">
        <div className="space-y-10">
          <section aria-labelledby="welcome-start">
            <Heading id="welcome-start">Start</Heading>
            <ul className="space-y-0.5 text-[15px]">
              <Action
                icon={FolderOpen}
                label="Open projects"
                hint="projects/"
                onClick={() => reveal("projects")}
              />
              <Action icon={BookOpen} label="About me" hint="about.py" to="/about" />
              <Action icon={GitGraph} label="Career history" hint="Git Graph" to="/experience" />
              <Action icon={Send} label="Send a message" hint="contact.http" to="/contact" />
              <Action icon={FileText} label="Plain view" hint="one page" to="/plain" />
              {resume && (
                <Action
                  icon={Download}
                  label="Download resume"
                  hint="resume.pdf"
                  href={resume}
                  download
                />
              )}
            </ul>
          </section>

          <section aria-labelledby="welcome-featured">
            <Heading id="welcome-featured">Featured</Heading>
            <ul className="space-y-5">
              {featured.map((p) => {
                const doc = docFor(p.slug);
                return (
                  <li key={p.slug}>
                    <Link
                      to={`/projects/${p.slug}`}
                      className="group inline-flex items-center gap-2 text-[15px] font-semibold text-link"
                    >
                      {doc && <FileIcon icon={doc.icon} />}
                      <span className="group-hover:underline">{p.name}</span>
                      <span className="font-mono text-xs font-normal text-muted">{doc?.title}</span>
                    </Link>
                    <p className="mt-1 max-w-[60ch] text-muted">{p.oneLiner}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {building.length > 0 && (
          <section aria-labelledby="welcome-building">
            <Heading id="welcome-building">Currently building</Heading>
            <ul className="space-y-4">
              {building.map((p) => {
                const built = known(p.built);
                return (
                  <li key={p.slug} className="rounded-md border border-dashed border-border p-4">
                    <p className="flex flex-wrap items-center gap-2">
                      <GitBranch className="size-4 text-muted" aria-hidden />
                      <span className="font-mono text-[13px]">{branchName(p)}</span>
                      <StatusPill status="building" />
                    </p>
                    <p className="mt-3">
                      <Link
                        to={`/projects/${p.slug}`}
                        className="text-[15px] font-semibold text-link hover:underline"
                      >
                        {p.name}
                      </Link>
                    </p>
                    <p className="mt-1 text-muted">{p.oneLiner}</p>
                    {built?.[0] && (
                      <p className="mt-3 text-sm">
                        <span className="text-muted">So far: </span>
                        {built[0]}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
