import { Check, ChevronRight, Menu as MenuIcon } from "lucide-react";
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { cx } from "@/lib/cx";
import type { Command } from "./commands";
import { formatKeys } from "./keys";
import { useMenus, type MenuDef, type MenuNode } from "./menus";

type FocusOnOpen = "first" | "last" | null;

const ITEMS = ':scope > li > [role^="menuitem"]';
const itemsOf = (list: HTMLElement | null) =>
  list ? [...list.querySelectorAll<HTMLElement>(ITEMS)] : [];

const listClass =
  "absolute z-50 min-w-60 rounded-md border border-border bg-chrome py-1 text-[13px] text-text shadow-xl";

/**
 * One dropdown (or submenu). Arrow keys move, Home and End jump, Right opens a submenu
 * or the next menu, Left closes a submenu or opens the previous menu, Escape steps back.
 */
function MenuList({
  id,
  label,
  items,
  focusOnOpen,
  isSubmenu,
  onBack,
  onActivate,
  onSwitch,
  className,
}: {
  id?: string;
  label: string;
  items: MenuNode[];
  focusOnOpen: FocusOnOpen;
  isSubmenu: boolean;
  /** Close this list and focus whatever opened it. */
  onBack: () => void;
  onActivate: (command: Command) => void;
  /** Move to the neighbouring top-level menu. */
  onSwitch?: (by: 1 | -1) => void;
  className: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [sub, setSub] = useState<{ index: number; focus: FocusOnOpen } | null>(null);
  const actionable = items.filter((n) => n.kind !== "separator");

  useEffect(() => {
    if (!focusOnOpen) return;
    const all = itemsOf(ref.current);
    (focusOnOpen === "first" ? all[0] : all.at(-1))?.focus();
  }, [focusOnOpen]);

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const all = itemsOf(ref.current);
    const index = all.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return; // A submenu's own key, already handled there.
    const node = actionable[index];
    const move = (to: number) => all[(to + all.length) % all.length]?.focus();
    switch (event.key) {
      case "ArrowDown":
        move(index + 1);
        break;
      case "ArrowUp":
        move(index - 1);
        break;
      case "Home":
        move(0);
        break;
      case "End":
        move(all.length - 1);
        break;
      case "ArrowRight":
        if (node?.kind === "submenu") setSub({ index, focus: "first" });
        else onSwitch?.(1);
        break;
      case "ArrowLeft":
        if (isSubmenu) onBack();
        else onSwitch?.(-1);
        break;
      case "Escape":
        onBack();
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  let index = -1;
  return (
    <ul
      ref={ref}
      id={id}
      role="menu"
      aria-label={label}
      onKeyDown={onKeyDown}
      // Clicks on padding or separators must not take focus out of the menu.
      onMouseDown={(e) => e.target === e.currentTarget && e.preventDefault()}
      className={cx(listClass, className)}
    >
      {items.map((node, i) => {
        if (node.kind === "separator")
          return <li key={`sep-${i}`} role="separator" className="mx-2 my-1 h-px bg-border" />;
        const at = ++index;
        const isSub = node.kind === "submenu";
        const command = node.kind === "command" ? node.command : undefined;
        const subOpen = sub?.index === at;
        const label = node.kind === "submenu" ? node.label : node.command.label;
        return (
          <li key={command?.id ?? `sub-${label}`} role="none" className="relative">
            <button
              type="button"
              tabIndex={-1}
              role={command?.checked !== undefined ? "menuitemcheckbox" : "menuitem"}
              aria-checked={command?.checked}
              aria-haspopup={isSub ? "menu" : undefined}
              aria-expanded={isSub ? subOpen : undefined}
              onPointerEnter={(e) => {
                e.currentTarget.focus();
                setSub(isSub ? { index: at, focus: null } : null);
              }}
              onClick={() => {
                if (command) onActivate(command);
                else setSub({ index: at, focus: "first" });
              }}
              className="flex h-7 w-full items-center gap-2 px-2 text-left focus:bg-selection aria-expanded:bg-selection"
            >
              <span className="grid w-4 shrink-0 place-items-center" aria-hidden>
                {command?.checked && <Check className="size-3.5" />}
              </span>
              <span className="flex-1 truncate pr-4">{label}</span>
              {command?.keys?.[0] && (
                <span className="shrink-0 text-xs text-muted">{formatKeys(command.keys[0])}</span>
              )}
              {isSub && <ChevronRight className="size-3.5 shrink-0 text-muted" aria-hidden />}
            </button>
            {node.kind === "submenu" && subOpen && (
              <MenuList
                label={node.label}
                items={node.items}
                focusOnOpen={sub.focus}
                isSubmenu
                onBack={() => {
                  setSub(null);
                  itemsOf(ref.current)[at]?.focus();
                }}
                onActivate={onActivate}
                className="top-0 left-full -mt-1 ml-0.5"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** A row of menu triggers (or the single ☰ trigger) and whichever menu is open. */
function MenuRoot({
  menus,
  compact = false,
  className,
}: {
  menus: MenuDef[];
  compact?: boolean;
  className: string;
}) {
  const [open, setOpen] = useState<{ index: number; focus: FocusOnOpen } | null>(null);
  const [current, setCurrent] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const focusTrigger = (index: number) => triggers.current[index]?.focus();

  const switchTo = (index: number, focus: FocusOnOpen) => {
    const next = (index + menus.length) % menus.length;
    setCurrent(next);
    setOpen({ index: next, focus });
    if (!focus) focusTrigger(next);
  };

  const onTriggerKeyDown = (event: KeyboardEvent, index: number) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowLeft": {
        if (compact) return;
        const next = (index + (event.key === "ArrowRight" ? 1 : -1) + menus.length) % menus.length;
        setCurrent(next);
        focusTrigger(next);
        if (open) setOpen({ index: next, focus: null });
        break;
      }
      case "ArrowDown":
      case "Enter":
      case " ":
        setOpen({ index, focus: "first" });
        break;
      case "ArrowUp":
        setOpen({ index, focus: "last" });
        break;
      case "Escape":
        if (!open) return;
        setOpen(null);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const onBlur = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && !rootRef.current?.contains(next)) setOpen(null);
  };

  return (
    <div
      ref={rootRef}
      role={compact ? undefined : "menubar"}
      aria-label={compact ? undefined : "Application menu"}
      onBlur={onBlur}
      className={cx("items-center", className)}
    >
      {menus.map((menu, i) => {
        const isOpen = open?.index === i;
        return (
          <div key={menu.label} className="relative">
            <button
              ref={(el) => {
                triggers.current[i] = el;
              }}
              type="button"
              role={compact ? undefined : "menuitem"}
              aria-label={compact ? menu.label : undefined}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={isOpen ? `menu-${i}${compact ? "-compact" : ""}` : undefined}
              tabIndex={i === current ? 0 : -1}
              onKeyDown={(e) => onTriggerKeyDown(e, i)}
              onClick={(e) => {
                if (e.detail === 0) return; // Keyboard activation is handled on keydown.
                setCurrent(i);
                setOpen(isOpen ? null : { index: i, focus: null });
              }}
              onPointerEnter={() => {
                if (open && !isOpen) switchTo(i, null);
              }}
              className={cx(
                "rounded hover:bg-hover aria-expanded:bg-selection",
                compact ? "grid size-7 place-items-center text-muted" : "h-6 px-1.5 text-[13px]",
              )}
            >
              {compact ? <MenuIcon className="size-4" aria-hidden /> : menu.label}
            </button>
            {isOpen && (
              <MenuList
                key={i}
                id={`menu-${i}${compact ? "-compact" : ""}`}
                label={menu.label}
                items={menu.items}
                focusOnOpen={open.focus}
                isSubmenu={false}
                onBack={() => {
                  setOpen(null);
                  focusTrigger(i);
                }}
                onActivate={(command) => {
                  setOpen(null);
                  focusTrigger(i);
                  command.run();
                }}
                onSwitch={compact ? undefined : (by) => switchTo(i + by, "first")}
                className="top-full left-0 mt-0.5"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * File, Edit, View, Go, Terminal and Help. Between 768px and 1280px the same menus sit
 * behind one ☰ button. Every item comes from the command list (commands.ts).
 */
export function MenuBar() {
  const menus = useMenus();
  const compact: MenuDef[] = [
    {
      label: "Application menu",
      items: menus.map((m) => ({ kind: "submenu", label: m.label, items: m.items })),
    },
  ];
  return (
    <>
      <MenuRoot menus={menus} className="hidden xl:flex" />
      <MenuRoot menus={compact} compact className="flex xl:hidden" />
    </>
  );
}
