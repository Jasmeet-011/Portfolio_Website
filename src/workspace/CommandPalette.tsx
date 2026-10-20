import { Command as Cmdk, defaultFilter } from "cmdk";
import { Check } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { FileIcon } from "@/assets/file-icons/FileIcon";
import { projects } from "@/content/projects";
import { useWorkspace } from "@/store/workspace";
import { useCommands, type Command } from "./commands";
import { docById, documents, type Doc } from "./documents";
import { formatKeys, matches } from "./keys";

/** What a file is matched by: its path, plus its name and project name. */
const docValue = (doc: Doc) => (doc.path.length ? doc.path.join("/") : doc.title);
const docKeywords = (doc: Doc) => [
  doc.title,
  ...projects.filter((p) => p.slug === doc.projectSlug).map((p) => p.name),
];
const docDetail = (doc: Doc) => (doc.path.length > 1 ? doc.path.slice(0, -1).join("/") : "");

// The ">" prefix picks the mode; it is not part of what's matched.
const filter = (value: string, search: string, keywords?: string[]) => {
  const query = search.replace(/^>\s*/, "");
  return query ? defaultFilter(value, query, keywords) : 1;
};

const itemClass =
  "flex min-h-8 cursor-pointer items-center gap-2 rounded px-2 py-1 data-[selected=true]:bg-selection";

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="ml-auto shrink-0 font-sans text-xs text-muted">{children}</kbd>;
}

function FileItems({ text, onPick }: { text: string; onPick: (doc: Doc) => void }) {
  const recent = useWorkspace((s) => s.recent);
  const recentDocs = recent.map(docById).filter((d): d is Doc => d !== undefined);
  // Recently opened first, like VS Code's quick open.
  const groups = text
    ? [{ heading: "Files", docs: documents }]
    : [
        { heading: "Recently opened", docs: recentDocs },
        { heading: "Files", docs: documents.filter((d) => !recent.includes(d.id)) },
      ];
  return groups.map(
    (g) =>
      g.docs.length > 0 && (
        <Cmdk.Group key={g.heading} heading={g.heading}>
          {g.docs.map((doc) => (
            <Cmdk.Item
              key={doc.id}
              value={docValue(doc)}
              keywords={docKeywords(doc)}
              onSelect={() => onPick(doc)}
              className={itemClass}
            >
              <FileIcon icon={doc.icon} />
              <span className="truncate">{doc.title}</span>
              <span className="truncate text-xs text-muted">{docDetail(doc)}</span>
            </Cmdk.Item>
          ))}
        </Cmdk.Group>
      ),
  );
}

function CommandItems({ onPick }: { onPick: (command: Command) => void }) {
  const commands = useCommands().filter((c) => c.enabled !== false);
  const recentIds = useWorkspace((s) => s.recentCommands);
  const recent = recentIds
    .map((id) => commands.find((c) => c.id === id))
    .filter((c): c is Command => c !== undefined);
  const rest = commands
    .filter((c) => !recentIds.includes(c.id))
    .sort((a, b) => a.title.localeCompare(b.title));
  return [
    { heading: "Recently used", items: recent },
    { heading: "Commands", items: rest },
  ].map(
    (g) =>
      g.items.length > 0 && (
        <Cmdk.Group key={g.heading} heading={g.heading}>
          {g.items.map((c) => (
            <Cmdk.Item key={c.id} value={c.title} onSelect={() => onPick(c)} className={itemClass}>
              <span className="truncate">{c.title}</span>
              {c.checked && <Check className="size-3.5 shrink-0" aria-label="current" />}
              {c.keys?.[0] && <Kbd>{formatKeys(c.keys[0])}</Kbd>}
            </Cmdk.Item>
          ))}
        </Cmdk.Group>
      ),
  );
}

/**
 * The command palette (plan.md 7.3). No prefix lists files, ">" lists commands.
 * A native modal dialog traps focus, closes on Escape and hands focus back on close.
 */
export function CommandPalette() {
  const text = useWorkspace((s) => s.palette);
  const setPalette = useWorkspace((s) => s.setPalette);
  const commands = useCommands();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = text !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[cmdk-input]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  /** Close first, so the dialog hands focus back before the action moves it. */
  const finish = (action: () => void) => {
    setPalette(null);
    requestAnimationFrame(action);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // The palette shortcuts switch modes while it is open.
    const find = (id: string) => commands.find((c) => c.id === id);
    const hit = (id: string) => find(id)?.keys?.some((k) => matches(event.nativeEvent, k));
    if (hit("go.file")) setPalette("");
    else if (hit("view.palette")) setPalette(">");
    else return;
    event.preventDefault();
  };

  const commandMode = text?.startsWith(">") ?? false;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Command palette"
      onClose={() => setPalette(null)}
      onClick={(e) => {
        if (e.target === e.currentTarget) setPalette(null);
      }}
      className="mx-auto mt-[12vh] mb-auto w-[min(38rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-lg border border-border bg-chrome p-0 text-sm text-text shadow-2xl backdrop:bg-editor/60"
    >
      {text !== null && (
        <Cmdk label="Command palette" filter={filter} loop>
          <Cmdk.Input
            value={text}
            onValueChange={setPalette}
            onKeyDown={onKeyDown}
            placeholder={
              commandMode ? "Type a command" : "Search files by name. Type > for commands."
            }
            className="h-10 w-full border-b border-border bg-input px-3 text-text outline-none placeholder:text-muted"
          />
          <Cmdk.List className="max-h-[min(60vh,26rem)] overflow-y-auto p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted">
            <Cmdk.Empty className="px-2 py-3 text-muted">
              {commandMode ? "No matching commands." : "No matching files."}
            </Cmdk.Empty>
            {commandMode ? (
              <CommandItems
                onPick={(c) =>
                  finish(() => {
                    useWorkspace.getState().touchCommand(c.id);
                    c.run();
                  })
                }
              />
            ) : (
              <FileItems text={text} onPick={(doc) => finish(() => navigate(doc.route))} />
            )}
          </Cmdk.List>
        </Cmdk>
      )}
    </dialog>
  );
}
