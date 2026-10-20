import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, type ReactNode, type Ref } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { usePreferences, ZOOM_MAX, ZOOM_MIN } from "@/store/preferences";
import { useWorkspace } from "@/store/workspace";
import { BuildDetails } from "../BuildDetails";
import { useCommands } from "../commands";
import { formatKeys } from "../keys";
import { ThemeOptions } from "../ThemeOptions";

function Section({
  title,
  id,
  headingRef,
  children,
}: {
  title: string;
  id: string;
  headingRef?: Ref<HTMLHeadingElement>;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-border px-4 py-3 first:border-t-0">
      <h3
        ref={headingRef}
        id={id}
        tabIndex={headingRef ? -1 : undefined}
        className="mb-2 text-[13px] font-medium text-muted"
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

const iconButton =
  "grid size-7 place-items-center rounded border border-border text-text hover:bg-hover disabled:opacity-40";

function Zoom() {
  const zoom = usePreferences((s) => s.zoom);
  const zoomBy = usePreferences((s) => s.zoomBy);
  const resetZoom = usePreferences((s) => s.resetZoom);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Zoom out"
        disabled={zoom <= ZOOM_MIN}
        onClick={() => zoomBy(-1)}
        className={iconButton}
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <output aria-label="Zoom level" className="w-12 text-center font-mono">
        {Math.round(zoom * 100)}%
      </output>
      <button
        type="button"
        aria-label="Zoom in"
        disabled={zoom >= ZOOM_MAX}
        onClick={() => zoomBy(1)}
        className={iconButton}
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        disabled={zoom === 1}
        onClick={resetZoom}
        className="ml-1 h-7 rounded px-2 text-link hover:bg-hover disabled:text-muted"
      >
        Reset
      </button>
    </div>
  );
}

function Motion() {
  const reduceMotion = usePreferences((s) => s.reduceMotion);
  const setReduceMotion = usePreferences((s) => s.setReduceMotion);
  const systemReduces = useMediaQuery("(prefers-reduced-motion: reduce)");
  return (
    <>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={reduceMotion || systemReduces}
          disabled={systemReduces}
          onChange={(e) => setReduceMotion(e.target.checked)}
          className="size-4 accent-accent"
        />
        Reduce motion
      </label>
      {systemReduces && (
        <p className="mt-1 text-[13px] text-muted">Your system already asks for reduced motion.</p>
      )}
    </>
  );
}

/** Every shortcut in the command list, so this reference always matches what works. */
function Shortcuts() {
  const commands = useCommands().filter((c) => c.keys?.length);
  return (
    <dl className="space-y-1.5 text-sm">
      {commands.map((c) => (
        <div key={c.id} className="flex items-baseline justify-between gap-3">
          <dt className="min-w-0">{c.title}</dt>
          <dd className="shrink-0 text-right text-xs">
            {c.keys?.map((k) => (
              <kbd key={formatKeys(k)} className="ml-1 rounded border border-border px-1 font-sans">
                {formatKeys(k)}
              </kbd>
            ))}
          </dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-3">
        <dt>Close a menu, dialog or drawer; leave Zen mode</dt>
        <dd className="shrink-0 text-xs">
          <kbd className="rounded border border-border px-1 font-sans">Esc</kbd>
        </dd>
      </div>
    </dl>
  );
}

/** Settings (plan.md 7.8): theme, zoom, motion, shortcut reference, version. */
export function SettingsView() {
  const focus = useWorkspace((s) => s.focus);
  const shortcutsRef = useRef<HTMLHeadingElement>(null);

  // Help > Keyboard Shortcuts lands here.
  useEffect(() => {
    if (focus?.target !== "shortcuts" || !useWorkspace.getState().takeFocus("shortcuts")) return;
    shortcutsRef.current?.focus();
    shortcutsRef.current?.scrollIntoView({ block: "start" });
  }, [focus]);

  return (
    <div className="pb-4">
      <div className="px-2 pb-3">
        <ThemeOptions />
      </div>
      <Section title="Zoom" id="settings-zoom">
        <Zoom />
      </Section>
      <Section title="Motion" id="settings-motion">
        <Motion />
      </Section>
      <Section title="Keyboard shortcuts" id="settings-shortcuts" headingRef={shortcutsRef}>
        <Shortcuts />
      </Section>
      <Section title="About" id="settings-about">
        <BuildDetails />
      </Section>
    </div>
  );
}
