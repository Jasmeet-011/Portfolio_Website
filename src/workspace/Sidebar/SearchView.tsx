import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { FileIcon } from "@/assets/file-icons/FileIcon";
import { MIN_QUERY, search, type FindState, type Match } from "@/lib/search";
import { useWorkspace } from "@/store/workspace";

/** Characters kept before a match, so the match itself fits the narrow sidebar. */
const CONTEXT = 12;

function Snippet({ match, length }: { match: Match; length: number }) {
  const from = Math.max(0, match.start - CONTEXT);
  const before = (from > 0 ? "…" : "") + match.text.slice(from, match.start);
  const hit = match.text.slice(match.start, match.start + length);
  const after = match.text.slice(match.start + length);
  return (
    <span className="block truncate">
      <span className="text-muted">{before}</span>
      <mark className="rounded-sm bg-selection text-text underline decoration-focus underline-offset-2">
        {hit}
      </mark>
      <span className="text-muted">{after}</span>
    </span>
  );
}

/**
 * The Search view: full-text search across every file, results grouped by file.
 * A result opens the file and highlights the match there (Editor.tsx).
 */
export function SearchView() {
  const query = useWorkspace((s) => s.searchQuery);
  const setQuery = useWorkspace((s) => s.setSearchQuery);
  const focus = useWorkspace((s) => s.focus);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => search(query), [query]);
  const total = results.reduce((n, r) => n + r.count, 0);
  const length = query.trim().length;

  useEffect(() => {
    if (focus?.target === "search" && useWorkspace.getState().takeFocus("search")) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [focus]);

  const summary =
    length < MIN_QUERY
      ? "Search every file in the workspace."
      : total === 0
        ? "No results."
        : `${total} ${total === 1 ? "result" : "results"} in ${results.length} ${results.length === 1 ? "file" : "files"}`;

  return (
    <div className="pb-3">
      <div className="px-3 pb-2">
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
          aria-describedby="search-summary"
          placeholder="Search"
          autoComplete="off"
          spellCheck={false}
          className="h-8 w-full rounded border border-border bg-input px-2 text-text placeholder:text-muted"
        />
        <p id="search-summary" role="status" className="mt-2 text-[13px] text-muted">
          {summary}
        </p>
      </div>
      {results.length > 0 && (
        <ul aria-label="Search results">
          {results.map(({ doc, matches, count }) => (
            <li key={doc.id} className="mb-1">
              <p className="flex h-7 items-center gap-1.5 px-3">
                <FileIcon icon={doc.icon} />
                <span className="truncate">{doc.title}</span>
                {doc.path.length > 1 && (
                  <span className="truncate text-[13px] text-muted">
                    {doc.path.slice(0, -1).join("/")}
                  </span>
                )}
                <span className="ml-auto shrink-0 rounded-full bg-surface px-1.5 text-xs text-text">
                  {count}
                </span>
              </p>
              <ul>
                {matches.map((m) => (
                  <li key={m.text}>
                    <Link
                      to={doc.route}
                      state={{ find: query.trim(), text: m.text } satisfies FindState}
                      className="block py-0.5 pr-3 pl-8 text-sm hover:bg-hover"
                    >
                      <Snippet match={m} length={length} />
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
