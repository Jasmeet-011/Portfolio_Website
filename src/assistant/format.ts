import { links } from "@/content/links";
import { buildChunks } from "./context";

/**
 * Turns an answer's plain text into blocks the panel renders as React elements, never
 * as HTML. Links are only made clickable when they point somewhere the content itself
 * links to (or to contact.http), so a manipulated answer can't plant a phishing link.
 */
export type Inline =
  | { type: "text"; text: string }
  | { type: "external"; text: string; href: string }
  | { type: "route"; text: string; to: string };

export type Block = { type: "paragraph"; inlines: Inline[] } | { type: "list"; items: Inline[][] };

export const chunks = buildChunks();
export const chunkById = new Map(chunks.map((c) => [c.id, c]));

const URL_PATTERN = /https?:\/\/[^\s)<>"]+[^\s)<>".,;:!?]/g;

/** Every URL the content links to: the only ones an answer may make clickable. */
export const allowedUrls = new Set(
  [...chunks.flatMap((c) => c.text.match(URL_PATTERN) ?? []), links.github, links.linkedin].map(
    (u) => u.replace(/\/$/, ""),
  ),
);

const TOKEN = new RegExp(
  `(${URL_PATTERN.source})|(${links.email.replace(/[.]/g, "\\.")})|(contact\\.http)`,
  "g",
);

export function inlines(text: string): Inline[] {
  const clean = text.replace(/\*\*/g, "");
  const out: Inline[] = [];
  let last = 0;
  for (const match of clean.matchAll(TOKEN)) {
    const [token, url, email] = match;
    const at = match.index ?? 0;
    if (at > last) out.push({ type: "text", text: clean.slice(last, at) });
    if (url)
      out.push(
        allowedUrls.has(url.replace(/\/$/, ""))
          ? { type: "external", text: url, href: url }
          : { type: "text", text: url },
      );
    else if (email) out.push({ type: "external", text: email, href: `mailto:${email}` });
    else out.push({ type: "route", text: token, to: "/contact" });
    last = at + token.length;
  }
  if (last < clean.length) out.push({ type: "text", text: clean.slice(last) });
  return out;
}

/** Paragraphs, and lists made of consecutive "- " lines. */
export function blocks(text: string): Block[] {
  const out: Block[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const item = /^[-*]\s+(.*)$/.exec(line);
    const previous = out.at(-1);
    if (item) {
      const content = inlines(item[1] ?? "");
      if (previous?.type === "list") previous.items.push(content);
      else out.push({ type: "list", items: [content] });
    } else out.push({ type: "paragraph", inlines: inlines(line) });
  }
  return out;
}
