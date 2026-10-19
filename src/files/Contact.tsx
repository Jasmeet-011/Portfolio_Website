import { useState, type FormEvent, type ReactNode } from "react";
import { links } from "@/content/links";
import { cx } from "@/lib/cx";
import type { Doc } from "@/workspace/documents";
import { FileView } from "./FileView";

const ENDPOINT = `https://formspree.io/f/${links.formspreeId}`;

const REASONS: Record<number, string> = {
  200: "OK",
  201: "Created",
  400: "Bad Request",
  403: "Forbidden",
  404: "Not Found",
  413: "Payload Too Large",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

interface Fields {
  name: string;
  email: string;
  message: string;
}

type Response =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "done"; ok: boolean; statusLine: string; body: string };

const EMPTY: Fields = { name: "", email: "", message: "" };

function pretty(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

/** The request as an .http file, with whatever the visitor has typed. */
function source(fields: Fields): string {
  return [
    "### Send me a message",
    `POST ${ENDPOINT}`,
    "Content-Type: application/json",
    "Accept: application/json",
    "",
    JSON.stringify(fields, null, 2),
    "",
  ].join("\n");
}

const input =
  "w-full rounded border border-border bg-input px-2 py-1 font-mono text-[13px] text-text placeholder:text-muted";

function Line({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cx("min-h-6", className)}>{children}</div>;
}

function Preview({
  fields,
  setFields,
  response,
  onSubmit,
}: {
  fields: Fields;
  setFields: (f: Fields) => void;
  response: Response;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const field = (key: keyof Fields, label: ReactNode, control: ReactNode) => (
    <Line className="flex flex-col gap-1 py-1 pl-[2ch] sm:flex-row sm:items-start sm:gap-2">
      <label htmlFor={`contact-${key}`} className="shrink-0 sm:w-[12ch] sm:pt-1">
        {label}
      </label>
      <div className="min-w-0 flex-1">{control}</div>
    </Line>
  );
  return (
    <div className="max-w-[80ch] px-6 pt-4 pb-16 sm:px-10">
      <form onSubmit={onSubmit} className="font-mono text-[13px] leading-6">
        <Line className="text-comment">
          # Send me a message. Fill in the fields, then send the request.
        </Line>
        <Line>
          <span className="text-link">POST</span> <span className="break-all">{ENDPOINT}</span>
        </Line>
        <Line>
          <span className="text-link">Content-Type</span>: application/json
        </Line>
        <Line>
          <span className="text-link">Accept</span>: application/json
        </Line>
        <Line />
        <Line>{"{"}</Line>
        {field(
          "name",
          <>&quot;name&quot;:</>,
          <input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            value={fields.name}
            onChange={(e) => setFields({ ...fields, name: e.target.value })}
            className={input}
          />,
        )}
        {field(
          "email",
          <>&quot;email&quot;:</>,
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={fields.email}
            onChange={(e) => setFields({ ...fields, email: e.target.value })}
            className={input}
          />,
        )}
        {field(
          "message",
          <>&quot;message&quot;:</>,
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            value={fields.message}
            onChange={(e) => setFields({ ...fields, message: e.target.value })}
            className={cx(input, "resize-y")}
          />,
        )}
        <Line>{"}"}</Line>
        {/* Formspree's spam trap: people never see or fill it. */}
        <input
          type="text"
          name="_gotcha"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
        />

        <div className="mt-4">
          <button
            type="submit"
            disabled={response.state === "sending"}
            className="h-8 rounded bg-accent px-3 font-sans text-sm font-medium text-on-accent hover:brightness-110 disabled:opacity-70"
          >
            {response.state === "sending" ? "Sending..." : "Send request"}
          </button>
        </div>
      </form>

      <section aria-label="Response" className="mt-8 rounded-md border border-border bg-chrome">
        <h2 className="border-b border-border px-3 py-1.5 text-xs font-medium text-muted">
          Response
        </h2>
        <div aria-live="polite" className="px-3 py-2 font-mono text-[13px] leading-6">
          {response.state === "idle" && (
            <p className="text-muted">Send the request to see the response here.</p>
          )}
          {response.state === "sending" && <p className="text-muted">Waiting for a response...</p>}
          {response.state === "done" && (
            <>
              <p className="flex items-center gap-2 font-semibold">
                <span
                  className={cx("size-2 rounded-full", response.ok ? "bg-success" : "bg-tag")}
                  aria-hidden
                />
                {response.statusLine}
              </p>
              {response.body && (
                <pre className="mt-1 break-words whitespace-pre-wrap text-muted">
                  {response.body}
                </pre>
              )}
              {response.ok && <p className="mt-1 font-sans">Thanks. Your message is on its way.</p>}
            </>
          )}
        </div>
      </section>

      <p className="mt-6 text-[15px]">
        Prefer email?{" "}
        <a href={`mailto:${links.email}`} className="text-link underline-offset-2 hover:underline">
          {links.email}
        </a>
      </p>
    </div>
  );
}

/** contact.http: a REST Client style request that posts to Formspree. */
export function Contact({ doc }: { doc: Doc }) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [response, setResponse] = useState<Response>({ state: "idle" });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const gotcha = new FormData(event.currentTarget).get("_gotcha");
    setResponse({ state: "sending" });
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...fields, _gotcha: gotcha ?? "" }),
      });
      const reason = res.statusText || REASONS[res.status] || "";
      setResponse({
        state: "done",
        ok: res.ok,
        statusLine: `HTTP/1.1 ${res.status} ${reason}`.trim(),
        body: pretty(await res.text()),
      });
      if (res.ok) setFields(EMPTY);
    } catch (error) {
      setResponse({
        state: "done",
        ok: false,
        statusLine: "Request failed",
        body: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <FileView
      doc={doc}
      preview={
        <Preview
          fields={fields}
          setFields={setFields}
          response={response}
          onSubmit={(e) => void onSubmit(e)}
        />
      }
      source={() => source(fields)}
    />
  );
}
