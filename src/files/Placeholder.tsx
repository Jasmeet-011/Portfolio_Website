import { WORKSPACE_NAME, type Doc } from "@/workspace/documents";

/** Phase 2 stand-in for every file. Content rendering is Phase 3. */
export function Placeholder({ doc }: { doc: Doc }) {
  const location = doc.path.length ? [WORKSPACE_NAME, ...doc.path].join("/") : doc.route;
  return (
    <div className="px-6 py-10 sm:px-10">
      <p className="font-mono text-xs text-muted">{location}</p>
      <h1 className="mt-2 font-mono text-2xl font-semibold">{doc.title}</h1>
      <p className="mt-4 max-w-prose text-[15px] text-muted">
        This file renders in Phase 3. The workspace around it is what is under review.
      </p>
    </div>
  );
}
