import { Logo } from "@/assets/logo/Logo";
import { links } from "@/content/links";
import { buildInfo } from "@/lib/buildInfo";
import { WORKSPACE_NAME } from "./documents";

const siteSource = links.others.find((l) => l.label === "Site source")?.href;

/** Version, commit, build date and stack. Shared by Settings and Help > About. */
export function BuildDetails() {
  const rows = [
    ["Version", buildInfo.version],
    ["Commit", buildInfo.commit],
    ["Built", buildInfo.date],
    ["Stack", buildInfo.stack.join(", ")],
  ];
  return (
    <div>
      <p className="flex items-center gap-2.5 font-mono text-text">
        <Logo size={32} />
        {WORKSPACE_NAME}
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {rows.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-muted">{term}</dt>
            <dd className="min-w-0 font-mono break-words">{value}</dd>
          </div>
        ))}
      </dl>
      {siteSource && (
        <p className="mt-3">
          <a
            href={siteSource}
            target="_blank"
            rel="noreferrer"
            className="text-link underline-offset-2 hover:underline"
          >
            Source on GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      )}
    </div>
  );
}
