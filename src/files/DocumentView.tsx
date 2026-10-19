import type { Doc } from "@/workspace/documents";
import { About } from "./About";
import { Placeholder } from "./Placeholder";
import { Readme } from "./Readme";

/** Picks the renderer for a document. */
export function DocumentView({ doc }: { doc: Doc }) {
  switch (doc.kind) {
    case "readme":
      return <Readme doc={doc} />;
    case "about":
      return <About doc={doc} />;
    default:
      return <Placeholder doc={doc} />;
  }
}
