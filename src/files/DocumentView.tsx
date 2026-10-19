import type { Doc } from "@/workspace/documents";
import { Placeholder } from "./Placeholder";

/** Picks the renderer for a document. Phase 3 replaces the placeholder per kind. */
export function DocumentView({ doc }: { doc: Doc }) {
  return <Placeholder doc={doc} />;
}
