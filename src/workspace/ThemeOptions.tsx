import { Check } from "lucide-react";
import { useTheme } from "@/store/theme";
import { themes, type ThemeId } from "@/themes/themes";

/** A preview of a theme: its editor color with its status bar color on the right. */
function Swatch({ id }: { id: ThemeId }) {
  return (
    <span
      data-theme={id}
      aria-hidden="true"
      className="flex h-5 w-7 shrink-0 overflow-hidden rounded-sm border border-border"
    >
      <span className="flex-1 bg-editor" />
      <span className="w-2 bg-statusbar" />
    </span>
  );
}

/**
 * The color theme choice, as a native radio group: arrow keys preview themes live,
 * a click or Enter confirms (onConfirm), Escape is handled by the caller.
 */
export function ThemeOptions({
  onConfirm,
  autoFocus = false,
}: {
  onConfirm?: () => void;
  autoFocus?: boolean;
}) {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  return (
    <fieldset>
      <legend className="mb-1.5 px-2 text-xs font-medium text-muted">Color theme</legend>
      {themes.map((t) => (
        <label
          key={t.id}
          // Pointer up fires before click, and onConfirm may close the picker, so pick here too.
          onPointerUp={() => {
            setTheme(t.id);
            onConfirm?.();
          }}
          className="flex h-8 cursor-pointer items-center gap-2.5 rounded px-2 hover:bg-hover has-checked:bg-surface has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-focus"
        >
          <input
            type="radio"
            name="color-theme"
            value={t.id}
            checked={theme === t.id}
            onChange={() => setTheme(t.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm?.();
            }}
            autoFocus={autoFocus && theme === t.id}
            className="sr-only"
          />
          <Swatch id={t.id} />
          <span className="flex-1">{t.label}</span>
          {theme === t.id && <Check className="size-4 text-text" aria-hidden />}
        </label>
      ))}
    </fieldset>
  );
}
