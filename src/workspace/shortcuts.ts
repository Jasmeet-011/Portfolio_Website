import { useLayoutEffect, useRef } from "react";
import { useWorkspace } from "@/store/workspace";
import type { Command } from "./commands";
import { isTyping, matches } from "./keys";

/** A dialog, drawer, popover or menu is open. Escape belongs to it. */
const overlayOpen = () =>
  document.querySelector('dialog[open], [role="dialog"], [role="menu"]') !== null;

/**
 * Global keyboard shortcuts, read from the command list. No shortcut fires while the
 * visitor is typing in a text field unless its command says so (plan.md 7.2).
 */
export function useShortcuts(commands: Command[]) {
  const latest = useRef(commands);
  useLayoutEffect(() => {
    latest.current = commands;
  }, [commands]);

  // A layout effect, so the listener is in place before anything is painted.
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        // Escape leaves Zen mode once nothing else is open to take it.
        if (useWorkspace.getState().zen && !overlayOpen()) useWorkspace.getState().toggleZen();
        return;
      }
      const typing = isTyping(event.target);
      for (const command of latest.current) {
        if (command.enabled === false || (typing && !command.inInputs)) continue;
        if (command.keys?.some((combo) => matches(event, combo))) {
          event.preventDefault();
          command.run();
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
