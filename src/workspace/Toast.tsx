import { useEffect } from "react";
import { useWorkspace } from "@/store/workspace";

/** A short confirmation, e.g. after copying a link. Announced to screen readers. */
export function Toast() {
  const toast = useWorkspace((s) => s.toast);
  const dismiss = useWorkspace((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => dismiss(toast.id), 3500);
    return () => window.clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <div role="status" className="pointer-events-none fixed right-3 bottom-9 z-50 max-w-sm">
      {toast && (
        <p className="rounded-md border border-border bg-chrome px-3 py-2 text-sm break-all text-text shadow-lg">
          {toast.text}
        </p>
      )}
    </div>
  );
}
