import { Tag } from "lucide-react";
import type { CSSProperties } from "react";
import { certifications } from "@/content/education";
import type { RoleKind } from "@/content/experience";
import { skillSlug } from "@/content/skills";
import { isTodo } from "@/content/todo";
import { commitMessage, graphRows, laneCount, laneKinds, mergeRow } from "@/lib/career";
import { cx } from "@/lib/cx";
import { formatMonth, formatRange } from "@/lib/dates";
import { Bullets, Chip, External, H1, H2, Muted, Page } from "./prose";

const LANE_GAP = 16;
const LANE_X0 = 10;
/** Vertical center of a row's first text line, where its dot sits. */
const DOT_Y = 20;

const KIND_COLOR: Record<RoleKind, string> = {
  research: "bg-comment",
  teaching: "bg-tag",
  internship: "bg-text",
  job: "bg-text",
};
const laneColor = (lane: number) =>
  lane === 0 ? "bg-muted" : KIND_COLOR[laneKinds[lane - 1] ?? "job"];
const laneX = (lane: number) => LANE_X0 + lane * LANE_GAP;

interface RowShape {
  /** Per lane: does the line run through the top half, the bottom half? */
  lines: Map<number, { top: boolean; bottom: boolean }>;
  /** Horizontal links at the dot's height: branch out (start) or merge back (end). */
  connectors: { lane: number }[];
}

/** Works out every row's lane segments from each role's start and merge rows. */
function shapes(): RowShape[] {
  const last = graphRows.length - 1;
  const out: RowShape[] = graphRows.map((_, r) => ({
    lines: new Map([[0, { top: r > 0, bottom: r < last }]]),
    connectors: [],
  }));
  const mark = (r: number, lane: number, part: "top" | "bottom") => {
    const shape = out[r];
    if (!shape) return;
    const line = shape.lines.get(lane) ?? { top: false, bottom: false };
    line[part] = true;
    shape.lines.set(lane, line);
  };
  graphRows.forEach((row, s) => {
    if (row.type !== "commit") return;
    const m = mergeRow(s);
    mark(s, row.lane, "top");
    out[s]?.connectors.push({ lane: row.lane });
    for (let r = s - 1; r > m; r--) {
      mark(r, row.lane, "top");
      mark(r, row.lane, "bottom");
    }
    if (m >= 0) {
      mark(m, row.lane, "bottom");
      out[m]?.connectors.push({ lane: row.lane });
    }
  });
  return out;
}

const rowShapes = shapes();
const graphWidth = LANE_X0 * 2 + (laneCount - 1) * LANE_GAP;

function Graph({ index }: { index: number }) {
  const shape = rowShapes[index];
  const row = graphRows[index];
  if (!shape || !row) return null;
  const dotLane = row.type === "commit" ? row.lane : 0;
  return (
    <div className="relative shrink-0" style={{ width: graphWidth }} aria-hidden="true">
      {[...shape.lines].map(([lane, { top, bottom }]) => {
        const style: CSSProperties = { left: laneX(lane) - 1 };
        if (top && bottom) Object.assign(style, { top: 0, bottom: 0 });
        else if (top) Object.assign(style, { top: 0, height: DOT_Y });
        else Object.assign(style, { top: DOT_Y, bottom: 0 });
        return <span key={lane} className={cx("absolute w-0.5", laneColor(lane))} style={style} />;
      })}
      {shape.connectors.map(({ lane }) => (
        <span
          key={`c${lane}`}
          className={cx("absolute h-0.5", laneColor(lane))}
          style={{ top: DOT_Y - 1, left: laneX(0), width: laneX(lane) - laneX(0) }}
        />
      ))}
      {row.type === "commit" ? (
        <span
          className={cx("absolute size-3 rounded-full ring-2 ring-editor", laneColor(dotLane))}
          style={{ left: laneX(dotLane) - 6, top: DOT_Y - 6 }}
        />
      ) : (
        <span
          className="absolute size-2.5 rotate-45 bg-muted ring-2 ring-editor"
          style={{ left: laneX(0) - 5, top: DOT_Y - 5 }}
        />
      )}
    </div>
  );
}

const pill = "rounded border border-border px-1.5 font-mono text-xs leading-5 text-text";

/** The Git Graph tab (/experience): the career, newest first. */
export function GitGraph() {
  const commits = graphRows.filter((r) => r.type === "commit").length;
  const tags = graphRows.length - commits;
  return (
    <Page className="max-w-[80ch]">
      <H1>Git Graph</H1>
      <Muted className="mt-1">
        main, {commits} commits, {tags} tags. Every role is a commit and every degree a tag, newest
        first.
      </Muted>

      <ol className="mt-6">
        {graphRows.map((row, i) => (
          <li key={row.slug} id={row.slug} className="flex scroll-mt-4">
            <Graph index={i} />
            <div className="min-w-0 flex-1 pt-2 pb-6 pl-2">
              {row.type === "commit" ? (
                <>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <code className="font-mono text-[13px] text-muted">{row.hash}</code>
                    <span className="font-semibold">{commitMessage(row.role)}</span>
                    {i === 0 && <span className={pill}>HEAD -&gt; main</span>}
                  </p>
                  <Muted className="text-sm">
                    {formatRange(row.role.start, row.role.end)}, {row.role.kind}
                  </Muted>
                  <p className="mt-2">{row.role.summary}</p>
                  {row.role.highlights.length > 0 && (
                    <div className="mt-2">
                      <Bullets items={row.role.highlights} />
                    </div>
                  )}
                  {row.role.stack.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {row.role.stack.map((s) => (
                        <Chip key={s} to={`/skills#${skillSlug(s)}`}>
                          {s}
                        </Chip>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <code className="font-mono text-[13px] text-muted">{row.hash}</code>
                    <span className={cx(pill, "inline-flex items-center gap-1")}>
                      <Tag className="size-3" aria-hidden />
                      tag: {row.slug}
                    </span>
                    <span className="font-semibold">{row.degree.degree}</span>
                  </p>
                  <p className="mt-1">{row.degree.school}</p>
                  <Muted className="text-sm">
                    {formatRange(row.degree.start, row.degree.end)}, {row.degree.grade}
                  </Muted>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>

      <H2>Certifications</H2>
      <ul>
        {certifications.map((c) => (
          <li key={c.slug} id={c.slug} className="scroll-mt-4">
            <External href={c.url}>{c.name}</External>
            <Muted className="text-sm">
              {c.issuer}
              {isTodo(c.earned) ? "" : `, ${formatMonth(c.earned)}`}
            </Muted>
          </li>
        ))}
      </ul>
    </Page>
  );
}
