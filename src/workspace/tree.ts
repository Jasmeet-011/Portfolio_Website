import { documents, type Doc } from "./documents";

export interface TreeFolder {
  kind: "folder";
  name: string;
  /** Folder path inside the workspace, e.g. "projects/archive". */
  key: string;
  children: TreeNode[];
}

export interface TreeFile {
  kind: "file";
  name: string;
  doc: Doc;
}

export type TreeNode = TreeFolder | TreeFile;

/** VS Code order: folders first, then case-insensitive by name. */
const byName = (a: TreeNode, b: TreeNode) => {
  if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
};

/** The explorer tree, built from every document that has a file path. */
function buildTree(docs: Doc[]): TreeNode[] {
  const root: TreeFolder = { kind: "folder", name: "", key: "", children: [] };
  for (const doc of docs) {
    let folder = root;
    doc.path.slice(0, -1).forEach((name, i) => {
      let next = folder.children.find(
        (n): n is TreeFolder => n.kind === "folder" && n.name === name,
      );
      if (!next) {
        next = { kind: "folder", name, key: doc.path.slice(0, i + 1).join("/"), children: [] };
        folder.children.push(next);
      }
      folder = next;
    });
    folder.children.push({ kind: "file", name: doc.title, doc });
  }
  const sort = (nodes: TreeNode[]): TreeNode[] =>
    [...nodes]
      .sort(byName)
      .map((n) => (n.kind === "folder" ? { ...n, children: sort(n.children) } : n));
  return sort(root.children);
}

export const explorerTree = buildTree(documents.filter((d) => d.path.length > 0));

/** Folder keys that must be open to show this document, the root ("") included. */
export const ancestorKeys = (doc: Doc): string[] =>
  doc.path.length === 0
    ? []
    : ["", ...doc.path.slice(0, -1).map((_, i) => doc.path.slice(0, i + 1).join("/"))];

/** DOM id of an explorer folder row, so breadcrumbs can focus it. */
export const folderDomId = (key: string): string => `tree-${key.replace(/[^\w-]/g, "-") || "root"}`;
