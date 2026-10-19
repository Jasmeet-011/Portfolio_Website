import type { Doc } from "@/workspace/documents";
import { About } from "./About";
import { Contact } from "./Contact";
import { Extensions } from "./Extensions";
import { GitGraph } from "./GitGraph";
import { ProjectFile } from "./ProjectFile";
import { Readme } from "./Readme";
import { Resume } from "./Resume";
import { Welcome } from "./Welcome";

/** Picks the renderer for a document. Every DocKind has one. */
export function DocumentView({ doc }: { doc: Doc }) {
  switch (doc.kind) {
    case "welcome":
      return <Welcome />;
    case "readme":
      return <Readme doc={doc} />;
    case "about":
      return <About doc={doc} />;
    case "project":
      return <ProjectFile doc={doc} />;
    case "contact":
      return <Contact doc={doc} />;
    case "resume":
      return <Resume />;
    case "experience":
      return <GitGraph />;
    case "skills":
      return <Extensions />;
  }
}
