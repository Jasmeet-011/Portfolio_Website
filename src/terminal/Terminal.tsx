import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { chunkById } from "@/assistant/format";
import { runAssistant } from "@/assistant/store";
import { cx } from "@/lib/cx";
import { useTheme } from "@/store/theme";
import { useWorkspace } from "@/store/workspace";
import { complete, execute, PROMPT } from "./commands";
import { useTerminal, type Segment } from "./store";

const TONES: Record<NonNullable<Segment["tone"]>, string> = {
  muted: "text-muted",
  link: "text-link",
  comment: "text-comment",
  tag: "text-tag",
};

function Output({ segment: s }: { segment: Segment }) {
  // Links are underlined so they stand out without relying on color.
  const tone = cx(s.tone && TONES[s.tone], (s.to || s.href) && "underline underline-offset-2");
  if (s.to)
    return (
      <Link to={s.to} className={cx(tone, "decoration-muted hover:decoration-current")}>
        {s.text}
      </Link>
    );
  if (s.href)
    return (
      <a
        href={s.href}
        target={s.href.startsWith("mailto:") ? undefined : "_blank"}
        rel="noreferrer"
        className={cx(tone, "decoration-muted hover:decoration-current")}
      >
        {s.text}
      </a>
    );
  return <span className={tone || undefined}>{s.text}</span>;
}

/** A mailto: link opens the mail app in place; anything else opens in a new tab. */
function openExternal(href: string) {
  if (href.startsWith("mailto:")) {
    const a = document.createElement("a");
    a.href = href;
    a.click();
  } else window.open(href, "_blank", "noopener,noreferrer");
}

/** How many monospace characters fit across the terminal (Plex Mono is 0.6em wide). */
function columnsOf(el: HTMLElement | null): number {
  if (!el) return 80;
  const size = parseFloat(getComputedStyle(el).fontSize) || 14;
  return Math.floor(el.clientWidth / (size * 0.6));
}

/**
 * `ask`: the answer streams into one line, then its sources follow as links. Shares the
 * panel's limits, quota and trace.
 */
function askInTerminal(question: string) {
  const term = useTerminal.getState();
  const id = term.printLive([{ text: "Looking through the workspace…", tone: "muted" }]);
  void runAssistant(
    { question },
    { question, chip: false, source: "terminal" },
    { onText: (text) => useTerminal.getState().update(id, [{ text }]) },
  ).then((result) => {
    const { update, print } = useTerminal.getState();
    if (result.error && !result.text) {
      const at = result.error.resetAt
        ? ` It resets at ${new Date(result.error.resetAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}.`
        : "";
      update(id, [{ text: `ask: ${result.error.message}${at}` }]);
      return;
    }
    const sources = result.declined
      ? []
      : result.citations.map((c) => chunkById.get(c)).filter((c) => c !== undefined);
    if (sources.length)
      print([
        [
          { text: "Sources: ", tone: "muted" },
          ...sources.flatMap((c, i): Segment[] => [
            ...(i > 0 ? [{ text: ", " }] : []),
            { text: c.label, tone: "link", to: c.route },
          ]),
        ],
      ]);
  });
}

/**
 * A terminal that takes the commands in plan.md 7.6. Enter runs, up and down walk the
 * history, Tab completes (and moves focus on as usual when the line is empty).
 */
export function Terminal() {
  const lines = useTerminal((s) => s.lines);
  const navigate = useNavigate();
  const focus = useWorkspace((s) => s.focus);
  const [value, setValue] = useState("");
  // Position while walking the history; null means editing a new line.
  const [cursor, setCursor] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focus?.target === "terminal" && useWorkspace.getState().takeFocus("terminal"))
      inputRef.current?.focus();
  }, [focus]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [lines]);

  const run = () => {
    const term = useTerminal.getState();
    const input = value.trim();
    term.print([[...PROMPT, { text: value }]]);
    if (input) term.remember(input);
    setValue("");
    setCursor(null);
    const result = execute(input, {
      open: (route) => navigate(route),
      openExternal,
      now: () => new Date(),
      columns: columnsOf(rootRef.current),
      ask: askInTerminal,
      setTheme: (id) => useTheme.getState().setTheme(id),
      currentTheme: useTheme.getState().theme,
      closePanel: () => useWorkspace.getState().closePanel(),
      history: useTerminal.getState().history,
    });
    if (result === "clear") term.clear();
    else term.print(result);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const { history } = useTerminal.getState();
    switch (event.key) {
      case "Enter":
        run();
        break;
      case "ArrowUp": {
        if (history.length === 0) return;
        const next = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
        setCursor(next);
        setValue(history[next] ?? "");
        break;
      }
      case "ArrowDown": {
        if (cursor === null) return;
        const next = cursor + 1;
        setCursor(next < history.length ? next : null);
        setValue(next < history.length ? (history[next] ?? "") : "");
        break;
      }
      case "Tab": {
        // An empty line lets Tab move focus, so keyboard users are never trapped here.
        if (value.trim() === "" || event.shiftKey) return;
        const { value: completed, options } = complete(value);
        setValue(completed);
        if (options.length)
          useTerminal
            .getState()
            .print([[...PROMPT, { text: value }], [{ text: options.join("  ") }]]);
        break;
      }
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <div
      ref={rootRef}
      className="min-h-full font-mono text-[14px] leading-[1.5]"
      onClick={(e) => {
        // A click on the terminal's background focuses the prompt, unless text is selected.
        if (e.target === e.currentTarget && !window.getSelection()?.toString())
          inputRef.current?.focus();
      }}
    >
      <div role="log" aria-label="Terminal output">
        {lines.map((line) => (
          <div key={line.id} className="break-words whitespace-pre-wrap">
            {line.segments.map((s, i) => (
              <Output key={i} segment={s} />
            ))}
          </div>
        ))}
      </div>
      <div ref={endRef} className="flex">
        <span aria-hidden className="shrink-0 whitespace-pre">
          {PROMPT.map((s, i) => (
            <Output key={i} segment={s} />
          ))}
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setCursor(null);
          }}
          onKeyDown={onKeyDown}
          aria-label="Terminal input"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-text caret-text"
        />
      </div>
    </div>
  );
}
