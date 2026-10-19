import type { Doc } from "@/workspace/documents";
import { About } from "./About";
import { Extensions } from "./Extensions";
import { GitGraph } from "./GitGraph";
import { Placeholder } from "./Placeholder";
import { ProjectFile } from "./ProjectFile";
import { Readme } from "./Readme";

/** Picks the renderer for a document. */
export function DocumentView({ doc }: { doc: Doc }) {
  switch (doc.kind) {
    case "readme":
      return <Readme doc={doc} />;
    case "about":
      return <About doc={doc} />;
    case "project":
      return <ProjectFile doc={doc} />;
    case "experience":
      return <GitGraph />;
    case "skills":
      return <Extensions />;
    default:
      return <Placeholder doc={doc} />;
  }
}
