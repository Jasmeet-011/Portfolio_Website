import { GitBranch, GitCommitHorizontal, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { certifications } from "@/content/education";
import { commitMessage, graphRows } from "@/lib/career";

const row =
  "flex min-h-7 items-center gap-2 py-1 pr-3 pl-4 hover:bg-hover aria-[current=true]:bg-selection";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-3">
      <h3 className="px-4 pb-1 text-[13px] font-medium text-muted">{title}</h3>
      <ul>{children}</ul>
    </section>
  );
}

/** The Source control sidebar view: the career's commits and tags. */
export function SourceControlView() {
  const { pathname, hash } = useLocation();
  const current = (slug: string) => pathname === "/experience" && hash === `#${slug}`;
  const commits = graphRows.filter((r) => r.type === "commit");
  const tags = graphRows.filter((r) => r.type === "tag");
  return (
    <nav aria-label="Source control" className="pb-3">
      <p className="flex items-center gap-2 px-4 py-1">
        <GitBranch className="size-4 text-muted" aria-hidden />
        <span className="font-mono text-sm">main</span>
      </p>
      <p className="px-4 pt-1">
        <Link to="/experience" className="text-link underline-offset-2 hover:underline">
          Open Git Graph
        </Link>
      </p>

      <Section title="Commits">
        {commits.map((c) => (
          <li key={c.slug}>
            <Link to={`/experience#${c.slug}`} aria-current={current(c.slug)} className={row}>
              <GitCommitHorizontal className="size-4 shrink-0 text-muted" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate">
                  {c.type === "commit" ? commitMessage(c.role) : ""}
                </span>
                <code className="font-mono text-xs text-muted">{c.hash}</code>
              </span>
            </Link>
          </li>
        ))}
      </Section>

      <Section title="Tags">
        {tags.map((t) => (
          <li key={t.slug}>
            <Link to={`/experience#${t.slug}`} aria-current={current(t.slug)} className={row}>
              <Tag className="size-4 shrink-0 text-muted" aria-hidden />
              <span className="truncate">{t.type === "tag" ? t.degree.degree : ""}</span>
            </Link>
          </li>
        ))}
        {certifications.map((c) => (
          <li key={c.slug}>
            <Link to={`/experience#${c.slug}`} aria-current={current(c.slug)} className={row}>
              <Tag className="size-4 shrink-0 text-muted" aria-hidden />
              <span className="truncate">{c.name}</span>
            </Link>
          </li>
        ))}
      </Section>
    </nav>
  );
}
