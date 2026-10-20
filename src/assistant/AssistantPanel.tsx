import { RotateCcw, SendHorizontal, Sparkles, Square, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LIMITS } from "../../api/_lib/protocol";
import { cx } from "@/lib/cx";
import { useWorkspace } from "@/store/workspace";
import { useRevealFolder } from "@/workspace/navigation";
import { buildSuggestions } from "./context";
import { blocks, chunkById, type Inline } from "./format";
import { useAssistant, type Message, type Notice } from "./store";

export type PanelMode = "split" | "overlay" | "sheet";

const suggestions = buildSuggestions();

const timeOf = (ms: number) =>
  new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const link = "text-link underline-offset-2 hover:underline";

function InlineText({ inline }: { inline: Inline }) {
  if (inline.type === "external")
    return (
      <a
        href={inline.href}
        target={inline.href.startsWith("mailto:") ? undefined : "_blank"}
        rel="noreferrer"
        className={cx(link, "break-all")}
      >
        {inline.text}
      </a>
    );
  if (inline.type === "route")
    return (
      <Link to={inline.to} className={link}>
        {inline.text}
      </Link>
    );
  return <>{inline.text}</>;
}

function AnswerText({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {blocks(text).map((block, i) =>
        block.type === "paragraph" ? (
          <p key={i}>
            {block.inlines.map((inline, j) => (
              <InlineText key={j} inline={inline} />
            ))}
          </p>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5 marker:text-muted">
            {block.items.map((item, j) => (
              <li key={j}>
                {item.map((inline, k) => (
                  <InlineText key={k} inline={inline} />
                ))}
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

/** The files an answer cites. Each chip opens that file at the cited section. */
function Sources({ citations }: { citations: string[] }) {
  const cited = citations.map((id) => chunkById.get(id)).filter((c) => c !== undefined);
  if (cited.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[13px] text-muted">Sources</p>
      <ul aria-label="Sources" className="flex flex-wrap gap-1.5">
        {cited.map((chunk) => (
          <li key={chunk.id}>
            <Link
              to={chunk.route}
              className="inline-flex h-7 items-center rounded-full border border-border bg-surface px-3 text-[13px] text-link hover:border-link"
            >
              {chunk.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  if (message.role === "user")
    return (
      <div className="ml-8 self-end rounded-lg bg-surface px-3 py-2 break-words whitespace-pre-wrap">
        {message.text}
      </div>
    );
  const thinking = message.status === "streaming" && !message.text;
  return (
    <div className="mr-2">
      {thinking ? (
        <p className="text-muted">Looking through the workspace…</p>
      ) : (
        <AnswerText text={message.text} />
      )}
      {message.error && (
        <p className="mt-2 text-muted" role="alert">
          {message.error.message}
        </p>
      )}
      {message.status === "done" && !message.declined && <Sources citations={message.citations} />}
    </div>
  );
}

function NoticeBox({ notice }: { notice: Notice }) {
  const reveal = useRevealFolder();
  const files: ReactNode =
    notice.code === "rate_limited" ? (
      <>
        Meanwhile, the{" "}
        <button type="button" className={link} onClick={() => reveal("projects")}>
          projects folder
        </button>{" "}
        and the{" "}
        <Link to="/plain" className={link}>
          Plain view
        </Link>{" "}
        have everything.
      </>
    ) : (
      <>
        Start with{" "}
        <Link to="/readme" className={link}>
          README.md
        </Link>{" "}
        or the{" "}
        <Link to="/plain" className={link}>
          Plain view
        </Link>
        .
      </>
    );
  return (
    <div role="status" className="mx-4 mb-2 rounded-md border border-border bg-surface p-3 text-sm">
      <p>
        {notice.message}
        {notice.code === "rate_limited" && notice.resetAt
          ? ` It resets at ${timeOf(notice.resetAt)}.`
          : ""}{" "}
        {files}
      </p>
    </div>
  );
}

/**
 * The assistant (plan.md 7.7): grounded answers with source chips. Beside the editor
 * from 1280px, over it from 768px, and a bottom sheet on phones (plan.md 8).
 */
export function AssistantPanel({ mode }: { mode: PanelMode }) {
  const messages = useAssistant((s) => s.messages);
  const quota = useAssistant((s) => s.quota);
  const busy = useAssistant((s) => s.busy);
  const notice = useAssistant((s) => s.notice);
  const { setOpen, clear, ask, askChip, stop } = useAssistant.getState();
  const focus = useWorkspace((s) => s.focus);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focus?.target === "assistant" && useWorkspace.getState().takeFocus("assistant"))
      inputRef.current?.focus();
  }, [focus]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  const submit = () => {
    const question = draft.trim();
    if (!question || busy) return;
    setDraft("");
    void ask(question);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const close = () => setOpen(false);
  const floating = mode !== "split";

  // Over the editor or as a sheet, Escape closes the panel wherever focus is,
  // unless a dialog (the palette, say) is open and needs it.
  useEffect(() => {
    if (!floating) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [floating, setOpen]);

  return (
    <aside
      aria-label="Assistant"
      className={cx(
        "flex flex-col border-border bg-assistant-panel text-text",
        mode === "split" && "w-[380px] shrink-0 border-l",
        mode === "overlay" &&
          "fixed top-10 right-0 bottom-7 z-30 w-[min(400px,100vw)] border-l shadow-2xl",
        mode === "sheet" &&
          "fixed inset-x-0 bottom-7 z-30 h-[78dvh] rounded-t-lg border-t shadow-2xl",
      )}
    >
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border pr-1 pl-4">
        <Sparkles className="size-4 text-assistant-text" aria-hidden />
        <h2 className="flex-1 text-sm font-medium">Assistant</h2>
        <button
          type="button"
          aria-label="Clear conversation"
          title="Clear conversation"
          disabled={messages.length === 0}
          onClick={clear}
          className="grid size-8 place-items-center rounded text-muted hover:bg-hover hover:text-text disabled:opacity-40"
        >
          <RotateCcw className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Close assistant"
          onClick={close}
          className="grid size-8 place-items-center rounded text-muted hover:bg-hover hover:text-text"
        >
          <X className="size-4" aria-hidden />
        </button>
      </header>

      <div
        role="log"
        aria-label="Conversation"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 text-[15px] leading-[1.6]"
      >
        {messages.length === 0 ? (
          <div>
            <p>
              Ask me about Jasmeet&apos;s projects, experience and skills. I answer only from the
              files in this workspace and link the ones I used.
            </p>
            <p className="mt-4 mb-2 text-[13px] text-muted">Try one of these</p>
            <ul className="flex flex-col items-start gap-1.5">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={busy || notice !== null}
                    onClick={() => void askChip(s)}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-left text-sm hover:border-assistant-text disabled:opacity-50"
                  >
                    {s.question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((m) => <Bubble key={m.id} message={m} />)
        )}
        <div ref={endRef} />
      </div>

      {notice && <NoticeBox notice={notice} />}

      <form
        className="shrink-0 border-t border-border px-4 pt-3 pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={LIMITS.questionChars}
            rows={2}
            aria-label="Ask about Jasmeet"
            placeholder="Ask about Jasmeet's work"
            className="min-h-11 flex-1 resize-none rounded-md border border-border bg-input px-3 py-2 text-sm text-text placeholder:text-muted"
          />
          {busy ? (
            <button
              type="button"
              aria-label="Stop"
              onClick={stop}
              className="grid size-11 place-items-center rounded-md border border-border text-text hover:bg-hover"
            >
              <Square className="size-4" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Send"
              disabled={!draft.trim() || notice !== null}
              className="grid size-11 place-items-center rounded-md bg-assistant text-on-assistant hover:brightness-110 disabled:opacity-50"
            >
              <SendHorizontal className="size-4" aria-hidden />
            </button>
          )}
        </div>
        <p className="mt-2 flex justify-between gap-3 text-[13px] text-muted">
          <span>
            {quota
              ? `${quota.remaining} of ${quota.limit} questions left this hour`
              : `Up to ${LIMITS.hourlyQuestions} questions an hour`}
          </span>
          {draft.length > LIMITS.questionChars - 100 && (
            <span>
              {draft.length}/{LIMITS.questionChars}
            </span>
          )}
        </p>
        <p className="mt-1.5 text-xs leading-snug text-muted">
          Answers come only from this workspace and can be wrong. Questions are sent to
          Google&apos;s Gemini API free tier, and Google may use them to improve its products. Your
          questions are saved anonymously for 30 days to improve the assistant, with no IP address
          or identifier attached. A one-way hash of your IP is used only to count the hourly limit.
        </p>
      </form>
    </aside>
  );
}
