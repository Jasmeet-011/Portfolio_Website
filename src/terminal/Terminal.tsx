import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
