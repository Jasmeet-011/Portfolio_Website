import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PlainView } from "@/plain/PlainView";
import { Workspace } from "@/workspace/Workspace";

// /plain is the one page outside the workspace. Every other path renders the workspace,
// which resolves the URL to a document (src/workspace/documents.ts); unknown paths show
// a not-found editor.
const router = createBrowserRouter([
  { path: "/plain", element: <PlainView /> },
  { path: "*", element: <Workspace /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
