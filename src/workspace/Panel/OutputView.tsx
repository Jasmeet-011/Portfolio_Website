import { useEffect, useRef } from "react";
import { useAssistant, type TraceEntry } from "@/assistant/store";

const time = (ms: number) =>
  new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const n = (value: number) => value.toLocaleString("en-US");

function Entry({ entry }: { entry: TraceEntry }) {
  const t = entry.trace;
  const kind = entry.chip
    ? "suggested question"
    : entry.source === "terminal"
      ? "terminal ask"
      : "question";
  return (
    <li className="py-1.5 whitespace-pre-wrap">
      <span className="text-muted">[{time(entry.at)}]</span> {kind}:{" "}
      <span className="text-text">&quot;{entry.question}&quot;</span>
      {t && (
        <>
          {"\n  "}
          <span className="text-muted">model</span> {t.model},{" "}
          {t.effort !== null && (
            <>
              <span className="text-muted">effort</span> {t.effort},{" "}
            </>
          )}
          <span className="text-muted">thinking</span> {t.thinking},{" "}
          <span className="text-muted">context</span> {t.contextVersion}
          {"\n  "}
          <span className="text-muted">cited</span>{" "}
          {t.citedChunks.length ? t.citedChunks.join(", ") : "nothing"}
          {t.declined ? ", declined as off-topic" : ""}
          {"\n  "}
          {t.cachedAnswer ? (
            <span className="text-comment">answer cache hit: no model call, no cost</span>
          ) : (
            <>
              <span className="text-muted">tokens</span> input {n(t.inputTokens)} (cache read{" "}
              {n(t.cacheReadTokens)}, cache write {n(t.cacheWriteTokens)}), output{" "}
              {n(t.outputTokens)}
              {t.thoughtTokens ? ` (thinking ${n(t.thoughtTokens)})` : ""}
              {"\n  "}
              <span className="text-muted">time</span> first words{" "}
              {t.ttftMs === null ? "none" : `${n(t.ttftMs)} ms`}, total {n(t.totalMs)} ms
            </>
          )}
        </>
      )}
      {entry.quota && (
        <>
          {"\n  "}
          <span className="text-muted">quota</span> {entry.quota.remaining} of {entry.quota.limit}{" "}
          left this hour
        </>
      )}
      {entry.error && (
        <>
          {"\n  "}
          <span className="text-tag">error</span> {entry.error.code}: {entry.error.message}
        </>
      )}
      {!t && !entry.error && (
        <>
          {"\n  "}
          <span className="text-muted">waiting for the answer</span>
        </>
      )}
    </li>
  );
}

/**
 * Output > Assistant trace: what each request cost and cited. Built from what this tab
 * received; it never shows secrets, IPs or anything about other visitors.
 */
export function OutputView() {
  const traces = useAssistant((s) => s.traces);
  const clearTraces = useAssistant((s) => s.clearTraces);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [traces]);

  return (
    <div className="font-mono text-[14px] leading-[1.5]">
      <div className="mb-1 flex items-center gap-3 font-sans text-sm">
        <label className="flex items-center gap-2 text-muted">
          Channel
          <select className="h-7 rounded border border-border bg-input px-2 text-text">
            <option>Assistant trace</option>
          </select>
        </label>
        <button
          type="button"
          onClick={clearTraces}
          disabled={traces.length === 0}
          className="h-7 rounded px-2 text-link hover:bg-hover disabled:text-muted"
        >
          Clear
        </button>
      </div>
      {traces.length === 0 ? (
        <p className="text-muted">
          No assistant requests yet. Each question you ask shows up here with its model, cited
          sections, tokens and timings.
        </p>
      ) : (
        <ol aria-label="Assistant trace">
          {traces.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
      <div ref={endRef} />
    </div>
  );
}
