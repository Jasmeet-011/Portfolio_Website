import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Workspace } from "@/workspace/Workspace";

// Every path renders the workspace, which resolves the URL to a document
// (src/workspace/documents.ts). Unknown paths show a not-found editor.
const router = createBrowserRouter([{ path: "*", element: <Workspace /> }]);

export function App() {
  return <RouterProvider router={router} />;
}
