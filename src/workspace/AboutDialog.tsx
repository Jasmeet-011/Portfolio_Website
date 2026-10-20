import { useEffect, useRef } from "react";
import { useWorkspace } from "@/store/workspace";
import { BuildDetails } from "./BuildDetails";

/** Help > About. A native modal dialog: focus is trapped and returned, Escape closes. */
export function AboutDialog() {
  const open = useWorkspace((s) => s.aboutOpen);
  const setOpen = useWorkspace((s) => s.setAboutOpen);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("button")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="about-title"
      onClose={() => setOpen(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-lg border border-border bg-chrome p-5 text-sm text-text shadow-2xl backdrop:bg-editor/60"
    >
      <h2 id="about-title" className="mb-3 text-[16px] font-semibold">
        About
      </h2>
      <BuildDetails />
      <form method="dialog" className="mt-5 flex justify-end">
        <button
          type="submit"
          className="h-8 rounded bg-accent px-4 font-medium text-on-accent hover:brightness-110"
        >
          OK
        </button>
      </form>
    </dialog>
  );
}
