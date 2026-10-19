import { BookOpen, Blocks, GitGraph } from "lucide-react";
import type { DocIcon } from "@/workspace/documents";
import { cx } from "@/lib/cx";

/** A two-letter language badge, drawn in the theme's token colors. */
function Badge({ label, className }: { label: string; className: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cx("size-4 shrink-0", className)} aria-hidden="true">
      <text
        x="8"
        y="12.4"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        letterSpacing="-0.8"
        fill="currentColor"
        className="font-mono"
      >
        {label}
      </text>
    </svg>
  );
}

/** Small file-type icons for the explorer, tabs and breadcrumbs. */
export function FileIcon({ icon, className }: { icon: DocIcon; className?: string }) {
  switch (icon) {
    case "py":
      return <Badge label="py" className={cx("text-link", className)} />;
    case "ts":
      return <Badge label="ts" className={cx("text-link", className)} />;
    case "js":
      return <Badge label="js" className={cx("text-muted", className)} />;
    case "md":
      return <Badge label="md" className={cx("text-muted", className)} />;
    case "http":
      // A request going out.
      return (
        <svg
          viewBox="0 0 16 16"
          className={cx("size-4 shrink-0 text-link", className)}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 8h10M9 4.5 12.5 8 9 11.5" />
        </svg>
      );
    case "pdf":
      return (
        <svg
          viewBox="0 0 16 16"
          className={cx("size-4 shrink-0 text-muted", className)}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 1.75h5.5L12.25 4.5v9.75H4z" />
          <path d="M9.25 1.75V4.75h3" />
        </svg>
      );
    case "welcome":
      return (
        <BookOpen
          className={cx("size-4 shrink-0 text-link", className)}
          strokeWidth={1.75}
          aria-hidden
        />
      );
    case "graph":
      return (
        <GitGraph
          className={cx("size-4 shrink-0 text-link", className)}
          strokeWidth={1.75}
          aria-hidden
        />
      );
    case "extensions":
      return (
        <Blocks
          className={cx("size-4 shrink-0 text-link", className)}
          strokeWidth={1.75}
          aria-hidden
        />
      );
  }
}
