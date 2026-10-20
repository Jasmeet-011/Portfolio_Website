import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { certifications, degrees, publications } from "@/content/education";
import { roles } from "@/content/experience";
import { links } from "@/content/links";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { isTodo, known } from "@/content/todo";
import { formatMonth, formatRange } from "@/lib/dates";
import { branchName, shownLinks } from "@/lib/projects";
import { skillGroups } from "@/lib/skills";

const link = "text-link underline underline-offset-2";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 break-inside-avoid-page">
      <h2 className="mb-3 border-b border-border pb-1 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Entry({ children }: { children: ReactNode }) {
  return <div className="mb-5 break-inside-avoid">{children}</div>;
}

/**
 * /plain: everything on one page, in one column of semantic HTML. Printable, and the
 * cleanest version for crawlers and screen readers. Same content as the workspace.
 */
export function PlainView() {
  // The workspace locks page scrolling; this page scrolls and prints normally.
  useEffect(() => {
    document.documentElement.dataset.page = "plain";
    return () => {
      delete document.documentElement.dataset.page;
    };
  }, []);

  const resume = known(links.resume);
  const bio = [profile.shortBio, profile.longBio].find((v): v is string => !isTodo(v));
  const ordered = [...projects].sort((a, b) => Number(a.archived) - Number(b.archived));

  return (
    <div className="min-h-dvh bg-editor text-text">
      <div className="mx-auto max-w-[72ch] px-6 py-10 text-[16px] leading-[1.65] print:px-0 print:py-0">
        <nav aria-label="Plain view" className="mb-8 flex flex-wrap gap-x-5 gap-y-1 print:hidden">
          <Link to="/" className={link}>
            Back to the workspace
          </Link>
          {resume && (
            <a href={resume} download className={link}>
              Download resume.pdf
            </a>
          )}
        </nav>

        <header>
          <h1 className="text-[30px] leading-tight font-semibold">{profile.name}</h1>
          <p className="mt-1 text-[18px]">
            {profile.positioning.charAt(0).toUpperCase() + profile.positioning.slice(1)}.
          </p>
          {bio && <p className="mt-2">{bio}</p>}
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            <li>{profile.location}</li>
            <li>
              <a href={`mailto:${links.email}`} className={link}>
                {links.email}
              </a>
            </li>
            <li>
              <a href={links.github} className={link}>
                GitHub
              </a>
            </li>
            <li>
              <a href={links.linkedin} className={link}>
                LinkedIn
              </a>
            </li>
          </ul>
        </header>

        <main>
          <Section title="Experience">
            {roles.map((r) => (
              <Entry key={r.slug}>
                <h3 className="font-semibold">
                  {r.title}, {r.company}
                </h3>
                <p className="text-muted">{formatRange(r.start, r.end)}</p>
                <p className="mt-1">{r.summary}</p>
                {r.highlights.length > 0 && (
                  <ul className="mt-1 list-disc pl-5">
                    {r.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                )}
              </Entry>
            ))}
          </Section>

          <Section title="Projects">
            {ordered.map((p) => {
              const built = known(p.built);
              const results = known(p.results);
              const context = known(p.context);
              const live = shownLinks(p).live;
              return (
                <Entry key={p.slug}>
                  <h3 className="font-semibold">
                    {p.links.github ? (
                      <a href={p.links.github} className={link}>
                        {p.name}
                      </a>
                    ) : (
                      p.name
                    )}
                    {p.archived && <span className="font-normal text-muted"> (archived)</span>}
                    {p.status === "building" && (
                      <span className="font-normal text-muted">
                        {" "}
                        (in progress, {branchName(p)})
                      </span>
                    )}
                  </h3>
                  <p>{p.oneLiner}</p>
                  {context && <p className="text-muted">{context}</p>}
                  {p.credits && (
                    <p className="text-muted">
                      Credit: {p.credits.text}
                      {p.credits.href && (
                        <>
                          {" "}
                          <a href={p.credits.href} className={link}>
                            Pull request
                          </a>
                        </>
                      )}
                    </p>
                  )}
                  {live && (
                    <p>
                      Live:{" "}
                      <a href={live} className={link}>
                        {live.replace(/^https:\/\//, "")}
                      </a>
                    </p>
                  )}
                  {built && (
                    <ul className="mt-1 list-disc pl-5">
                      {built.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {results && (
                    <ul className="mt-1 list-disc pl-5">
                      {results.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 text-muted">
                    {[p.language, ...p.stack.filter((s) => s !== p.language)].join(", ")}
                  </p>
                </Entry>
              );
            })}
          </Section>

          <Section title="Education">
            {degrees.map((d) => (
              <Entry key={d.slug}>
                <h3 className="font-semibold">{d.degree}</h3>
                <p>
                  {d.school}, {d.grade}
                </p>
                <p className="text-muted">{formatRange(d.start, d.end)}</p>
              </Entry>
            ))}
          </Section>

          <Section title="Certification">
            {certifications.map((c) => (
              <Entry key={c.slug}>
                <p>
                  <a href={c.url} className={link}>
                    {c.name}
                  </a>
                  , {c.issuer}
                  {isTodo(c.earned) ? "" : `, ${formatMonth(c.earned)}`}
                </p>
              </Entry>
            ))}
          </Section>

          <Section title="Publication">
            {publications.map((p) => (
              <Entry key={p.slug}>
                <p>
                  <a href={p.url} className={link}>
                    {p.title}
                  </a>
                </p>
                <p className="text-muted">{p.venue}</p>
              </Entry>
            ))}
          </Section>

          <Section title="Skills">
            <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
              {skillGroups.map((g) => (
                <div key={g.category} className="contents">
                  <dt className="font-semibold">{g.category}</dt>
                  <dd className="mb-2 sm:mb-0">{g.skills.map((s) => s.name).join(", ")}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </main>
      </div>
    </div>
  );
}
