import { ChevronRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { FileIcon } from "@/assets/file-icons/FileIcon";
import { cx } from "@/lib/cx";
import { useWorkspace } from "@/store/workspace";
import { WORKSPACE_NAME } from "../documents";
import { explorerTree, folderDomId, type TreeNode } from "../tree";

interface RowOptions {
  /** Taller rows for the phone drawer. */
  touch: boolean;
  depth: number;
}

const rowClass = ({ touch }: RowOptions) =>
  cx(
    "flex w-full items-center gap-1.5 pr-3 text-left hover:bg-hover",
    touch ? "h-11 text-[15px]" : "h-6",
  );

const indent = ({ depth }: RowOptions): CSSProperties => ({ paddingLeft: 8 + depth * 12 });

function Chevron({ open }: { open: boolean }) {
  return (
    <ChevronRight
      className={cx("size-4 shrink-0 text-muted", open && "rotate-90")}
      strokeWidth={1.75}
      aria-hidden
    />
  );
}

function Folder({
  name,
  folderKey,
  children,
  options,
}: {
  name: string;
  folderKey: string;
  children: ReactNode;
  options: RowOptions;
}) {
  const open = useWorkspace((s) => s.expanded[folderKey] ?? false);
  const toggleFolder = useWorkspace((s) => s.toggleFolder);
  return (
    <li>
      <button
        type="button"
        id={folderDomId(folderKey)}
        aria-expanded={open}
        onClick={() => toggleFolder(folderKey)}
        className={rowClass(options)}
        style={indent(options)}
      >
        <Chevron open={open} />
        <span className="truncate">{name}</span>
      </button>
      {open && children}
    </li>
  );
}

function Nodes({
  nodes,
  activeId,
  options,
}: {
  nodes: TreeNode[];
  activeId: string | undefined;
  options: RowOptions;
}) {
  const child = { ...options, depth: options.depth + 1 };
  return (
    <ul>
      {nodes.map((node) =>
        node.kind === "folder" ? (
          <Folder key={node.key} name={node.name} folderKey={node.key} options={options}>
            <Nodes nodes={node.children} activeId={activeId} options={child} />
          </Folder>
        ) : (
          <li key={node.doc.id}>
            <Link
              to={node.doc.route}
              aria-current={node.doc.id === activeId ? "page" : undefined}
              className={cx(rowClass(options), "aria-[current=page]:bg-surface")}
              style={indent(options)}
            >
              {/* Lines file icons up with folder names. */}
              <span className="w-4 shrink-0" aria-hidden />
              <FileIcon icon={node.doc.icon} />
              <span className="truncate">{node.name}</span>
            </Link>
          </li>
        ),
      )}
    </ul>
  );
}

export function Explorer({
  activeId,
  touch = false,
}: {
  activeId: string | undefined;
  touch?: boolean;
}) {
  const options = { touch, depth: 0 };
  return (
    <nav aria-label="Explorer" className="pb-2">
      <ul>
        <Folder name={WORKSPACE_NAME} folderKey="" options={options}>
          <Nodes nodes={explorerTree} activeId={activeId} options={{ touch, depth: 1 }} />
        </Folder>
      </ul>
    </nav>
  );
}
