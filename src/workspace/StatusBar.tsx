import { CircleX, GitBranch, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cx } from "@/lib/cx";
import { useTheme } from "@/store/theme";
import { useWorkspace } from "@/store/workspace";
import { themeLabel } from "@/themes/themes";
import { WORKSPACE_NAME, type Doc } from "./documents";
import { ThemeOptions } from "./ThemeOptions";

const item = "flex h-full items-center gap-1 px-2 whitespace-nowrap";
const button = cx(
  item,
  "hover:bg-on-statusbar/15 focus-visible:outline-on-statusbar aria-expanded:bg-on-statusbar/15",
);

function Item({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx(item, className)}>{children}</span>;
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  const label = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  // Decorative, so it gives way first on phones, where the bar is full at 14px.
  return (
    <Item className="hidden sm:flex">
      <time dateTime={now.toISOString()}>{label}</time>
    </Item>
  );
}

/** The theme name. Opens a picker that previews themes live. */
function ThemeButton() {
  const theme = useTheme((s) => s.theme);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!popoverRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Color theme: ${themeLabel(theme)}`}
        onClick={() => setOpen((o) => !o)}
        className={button}
      >
        {themeLabel(theme)}
      </button>
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Color theme"
          className="absolute right-1 bottom-full z-50 mb-1 w-60 rounded-md border border-border bg-chrome p-1.5 text-sm text-text"
        >
          <ThemeOptions onConfirm={close} autoFocus />
        </div>
      )}
    </>
  );
}

export function StatusBar({ doc }: { doc: Doc | undefined }) {
  const problemsOpen = useWorkspace((s) => s.panelOpen && s.panelTab === "problems");
  const togglePanel = useWorkspace((s) => s.togglePanel);
  return (
    <footer
      aria-label="Status bar"
      className="relative flex h-7 shrink-0 items-center justify-between border-t border-border bg-statusbar px-1 text-sm text-on-statusbar"
    >
      <div className="flex h-full min-w-0 items-center overflow-hidden">
        <Item>
          <GitBranch className="size-3.5" aria-hidden />
          main
        </Item>
        <button
          type="button"
          aria-expanded={problemsOpen}
          aria-label="Problems: 0 errors, 0 warnings"
          onClick={() => togglePanel("problems")}
          className={button}
        >
          <CircleX className="size-3.5" aria-hidden />0
          <TriangleAlert className="ml-1 size-3.5" aria-hidden />0
        </button>
        <Item className="hidden sm:flex">{WORKSPACE_NAME}</Item>
      </div>
      <div className="flex h-full items-center">
        <Link to="/plain" className={button}>
          Plain view
        </Link>
        {doc?.language && <Item className="hidden sm:flex">{doc.language}</Item>}
        <Item className="hidden md:flex">UTF-8</Item>
        <Item className="hidden md:flex">LF</Item>
        <ThemeButton />
        <Clock />
      </div>
    </footer>
  );
}
