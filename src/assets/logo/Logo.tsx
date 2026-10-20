import data from "./marks.json";

export type MarkId = keyof typeof data.marks;

/**
 * The site's mark: Workspace Blue rounded square with white strokes. Drawn from
 * marks.json, the same data scripts/build-favicon.mjs turns into the favicon. Colors
 * come from theme tokens here, so the mark follows the active theme's accent.
 */
export function Logo({
  size = 18,
  mark = data.chosen as MarkId,
  className,
}: {
  size?: number;
  mark?: MarkId;
  className?: string;
}) {
  const m = data.marks[mark];
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      data-mark={mark}
    >
      <rect x="1" y="1" width="30" height="30" rx="7" className="fill-accent" />
      <g
        fill="none"
        strokeWidth={m.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-on-accent"
      >
        {m.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {m.rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} {...r} className="fill-on-accent" />
      ))}
    </svg>
  );
}
