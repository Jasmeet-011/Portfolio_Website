import { X } from "lucide-react";
import { useEffect, type KeyboardEvent } from "react";
import { cx } from "@/lib/cx";
import { useWorkspace, type PanelTab } from "@/store/workspace";
import { Terminal } from "@/terminal/Terminal";

const TABS: { id: PanelTab; label: string }[] = [
  { id: "terminal", label: "Terminal" },
  { id: "problems", label: "Problems" },
];

function Body({ tab }: { tab: PanelTab }) {
  switch (tab) {
    case "terminal":
      return <Terminal />;
    case "problems":
      return <p className="text-muted">No problems have been detected in the workspace.</p>;
  }
}

/**
 * Terminal and Problems. The Output tab (with the assistant trace) joins in Phase 5.
 * Docked under the editor on desktop, a bottom sheet on phones. */
export function Panel({ isDesktop }: { isDesktop: boolean }) {
  const tab = useWorkspace((s) => s.panelTab);
  const setPanelTab = useWorkspace((s) => s.setPanelTab);
  const closePanel = useWorkspace((s) => s.closePanel);

  useEffect(() => {
    if (isDesktop) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isDesktop, closePanel]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (step === undefined) return;
    const next = TABS[(index + step + TABS.length) % TABS.length];
    if (!next) return;
    setPanelTab(next.id);
    document.getElementById(`panel-tab-${next.id}`)?.focus();
  };

  return (
    <section
      aria-label="Panel"
      className={cx(
        "flex flex-col border-t border-border",
        isDesktop
          ? "h-56 shrink-0 bg-chrome"
          : "fixed inset-x-0 bottom-6 z-30 h-[50dvh] rounded-t-lg bg-chrome",
      )}
    >
      <div className="flex h-9 shrink-0 items-center justify-between pr-1 pl-2">
        <div role="tablist" aria-label="Panel" className="flex h-full">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`panel-tab-${t.id}`}
              aria-selected={t.id === tab}
              aria-controls="panel-body"
              tabIndex={t.id === tab ? 0 : -1}
              onClick={() => setPanelTab(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className="relative px-2.5 text-xs text-muted hover:text-text aria-selected:text-text"
            >
              {t.label}
              {t.id === tab && (
                <span className="absolute inset-x-2.5 bottom-1.5 h-px bg-accent" aria-hidden />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Close panel"
          onClick={closePanel}
          className="grid size-7 place-items-center rounded text-muted hover:bg-hover hover:text-text"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div
        id="panel-body"
        role="tabpanel"
        aria-labelledby={`panel-tab-${tab}`}
        className="min-h-0 flex-1 overflow-auto px-4 py-1 text-[13px]"
      >
        <Body tab={tab} />
      </div>
    </section>
  );
}
