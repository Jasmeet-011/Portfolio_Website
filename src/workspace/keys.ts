/**
 * Keyboard shortcuts. Combos match on `event.code`, so Option on macOS (which changes
 * `event.key`) and keyboard layouts don't break them.
 */
export interface KeyCombo {
  code: string;
  /** Cmd on macOS, Ctrl elsewhere. */
  mod?: boolean;
  /** Ctrl on every platform (Ctrl+` is Ctrl on macOS too, like VS Code). */
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

/** Ctrl+Alt+I, or Cmd+Ctrl+I on macOS, like VS Code's chat (Decisions log, 2026-10-20). */
export const ASSISTANT_KEYS: KeyCombo = isMac
  ? { code: "KeyI", mod: true, ctrl: true }
  : { code: "KeyI", ctrl: true, alt: true };

export function matches(event: KeyboardEvent, combo: KeyCombo): boolean {
  const ctrl = !!combo.ctrl || (!!combo.mod && !isMac);
  const meta = !!combo.mod && isMac;
  return (
    event.code === combo.code &&
    event.ctrlKey === ctrl &&
    event.metaKey === meta &&
    event.shiftKey === !!combo.shift &&
    event.altKey === !!combo.alt
  );
}

const KEY_LABELS: Record<string, string> = {
  Backquote: "`",
  BracketLeft: "[",
  BracketRight: "]",
  Escape: "Esc",
};

const keyLabel = (code: string): string => KEY_LABELS[code] ?? code.replace(/^Key|^Digit/, "");

/** "Ctrl+Shift+P" elsewhere, "Cmd+Shift+P" on macOS. */
export function formatKeys(combo: KeyCombo): string {
  return [
    combo.ctrl && "Ctrl",
    combo.mod && (isMac ? "Cmd" : "Ctrl"),
    combo.alt && (isMac ? "Option" : "Alt"),
    combo.shift && "Shift",
    keyLabel(combo.code),
  ]
    .filter(Boolean)
    .join("+");
}

/** True when the event comes from a field the visitor types into. */
export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (!(target instanceof HTMLInputElement)) return false;
  return !["checkbox", "radio", "button", "submit", "reset", "range", "color", "file"].includes(
    target.type,
  );
}
