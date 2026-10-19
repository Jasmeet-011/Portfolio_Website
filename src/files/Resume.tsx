import { Download } from "lucide-react";
import { links } from "@/content/links";
import { known } from "@/content/todo";
import { External } from "./prose";

/**
 * resume.pdf: preview and download. The explorer only lists this file once
 * links.resume points at public/resume.pdf, so it renders nothing until then.
 */
export function Resume() {
  const href = known(links.resume);
  if (!href) return null;
  return (
    <div className="flex h-full min-h-[70dvh] flex-col">
      <div className="flex flex-wrap items-center gap-4 px-6 py-3">
        <a
          href={href}
          download="Jasmeet-Singh-Wadhwa-resume.pdf"
          className="inline-flex h-8 items-center gap-2 rounded bg-accent px-3 text-sm font-medium text-on-accent hover:brightness-110"
        >
          <Download className="size-4" aria-hidden />
          Download resume.pdf
        </a>
        <External href={href}>Open in a new tab</External>
      </div>
      <object data={href} type="application/pdf" aria-label="Resume" className="w-full flex-1">
        <p className="px-6 py-4">
          This browser cannot show the PDF here. Use the download button above.
        </p>
      </object>
    </div>
  );
}
