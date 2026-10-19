import { ExternalLink as ExternalIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cx } from "@/lib/cx";

/** Shared building blocks for file previews: readable prose, not code. */

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <article
      className={cx("max-w-[72ch] px-6 pt-4 pb-16 text-[15px] leading-7 sm:px-10", className)}
    >
      {children}
    </article>
  );
}

export function FilePath({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs text-muted">{children}</p>;
}

export function H1({ children }: { children: ReactNode }) {
  return <h1 className="mt-1 text-[28px] leading-tight font-semibold">{children}</h1>;
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-10 mb-3 border-b border-border pb-1.5 text-[17px] font-semibold">
      {children}
    </h2>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[17px] leading-7 text-text">{children}</p>;
}

export function Muted({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-muted", className)}>{children}</p>;
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-muted">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

const linkClass = "text-link underline-offset-2 hover:underline";

/** A link to a page outside the site. */
export function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cx(linkClass, "inline-flex items-center gap-1")}
    >
      {children}
      <ExternalIcon className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** A link to another file or view inside the workspace. */
export function Open({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={linkClass}>
      {children}
    </Link>
  );
}

/** A small rounded label. Interactive chips are links, so they use the link color. */
export function Chip({ children, to }: { children: ReactNode; to?: string }) {
  const base =
    "inline-flex h-6 items-center rounded-full border border-border bg-surface px-2.5 text-xs";
  return to ? (
    <Link to={to} className={cx(base, "text-link hover:border-link")}>
      {children}
    </Link>
  ) : (
    <span className={cx(base, "text-text")}>{children}</span>
  );
}

/** Status with a small dot: green for shipped, mauve for building, muted for archived. */
export function StatusPill({ status }: { status: "shipped" | "building" | "archived" }) {
  const dot = { shipped: "bg-success", building: "bg-tag", archived: "bg-muted" }[status];
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-border px-2.5 text-xs text-text">
      <span className={cx("size-1.5 rounded-full", dot)} aria-hidden />
      {status}
    </span>
  );
}
