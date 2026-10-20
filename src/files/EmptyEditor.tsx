import { Link } from "react-router-dom";

const action = "text-link underline-offset-2 hover:underline";

/** Shown when every tab is closed. */
export function NoEditor() {
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="text-center">
        <p className="text-muted">No editor is open.</p>
        <p className="mt-2">
          <Link to="/" className={action}>
            Open Welcome
          </Link>
        </p>
      </div>
    </div>
  );
}

export function NotFound({ pathname }: { pathname: string }) {
  return (
    <div className="px-6 py-10 sm:px-10">
      <p className="font-mono text-[13px] text-muted">{pathname}</p>
      <h1 className="mt-2 text-2xl font-semibold">Nothing lives at this path</h1>
      <p className="mt-4">
        <Link to="/" className={action}>
          Open Welcome
        </Link>
      </p>
    </div>
  );
}
