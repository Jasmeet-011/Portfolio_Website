import type { Doc } from "@/workspace/documents";
import { About } from "./About";
import { Contact } from "./Contact";
import { Extensions } from "./Extensions";
import { GitGraph } from "./GitGraph";
import { Placeholder } from "./Placeholder";
import { ProjectFile } from "./ProjectFile";
import { Readme } from "./Readme";
import { Resume } from "./Resume";

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
    case "contact":
      return <Contact doc={doc} />;
    case "resume":
      return <Resume />;
    default:
      return <Placeholder doc={doc} />;
  }
}
