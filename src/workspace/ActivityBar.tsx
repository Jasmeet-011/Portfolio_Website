import { Blocks, Files, GitBranch, Search, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import { useWorkspace, type SidebarView } from "@/store/workspace";

// Run and Debug is out until a second project has a running demo (plan.md Decisions log).
// The assistant joins in Phase 5.
const VIEWS: { view: SidebarView; label: string; Icon: LucideIcon }[] = [
  { view: "explorer", label: "Explorer", Icon: Files },
  { view: "search", label: "Search", Icon: Search },
  { view: "scm", label: "Source control", Icon: GitBranch },
  { view: "extensions", label: "Extensions", Icon: Blocks },
];

const itemClass =
  "relative grid size-12 place-items-center text-muted hover:text-text aria-pressed:text-text";

function ViewButton({ view, label, Icon }: { view: SidebarView; label: string; Icon: LucideIcon }) {
  const pressed = useWorkspace((s) => s.sidebarOpen && s.sidebarView === view);
  const toggleView = useWorkspace((s) => s.toggleView);
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={() => toggleView(view)}
      className={itemClass}
    >
      <span
        className={cx("absolute inset-y-1.5 left-0 w-0.5 bg-text", !pressed && "hidden")}
        aria-hidden
      />
      <Icon className="size-6" strokeWidth={1.5} aria-hidden />
    </button>
  );
}

export function ActivityBar() {
  return (
    <div
      aria-label="Views"
      role="group"
      className="flex w-12 shrink-0 flex-col justify-between border-r border-border bg-activitybar"
    >
      <div className="flex flex-col">
        {VIEWS.map((v) => (
          <ViewButton key={v.view} {...v} />
        ))}
      </div>
      <ViewButton view="settings" label="Settings" Icon={Settings} />
    </div>
  );
}
