import { create } from "zustand";
import type {
  AssistantRequest,
  ChatTurn,
  ErrorBody,
  ErrorCode,
  Quota,
  Trace,
} from "../../api/_lib/protocol";
import { requestAnswer } from "./client";
import type { Suggestion } from "./context";

export interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  citations: string[];
  status: "streaming" | "done" | "error";
  error?: { code: ErrorCode; message: string };
  declined?: boolean;
}

/** One request, as Output > Assistant trace shows it. Lives in this tab only. */
export interface TraceEntry {
  id: number;
  at: number;
  question: string;
  chip: boolean;
  source: "panel" | "terminal";
  trace?: Trace;
  quota?: Quota | null;
  error?: { code: ErrorCode; message: string };
}

/** A limit or outage that stops new questions, with what to tell the visitor. */
export interface Notice {
  code: "rate_limited" | "daily_cap" | "unavailable";
  message: string;
  resetAt?: number;
}

interface AssistantState {
  open: boolean;
  messages: Message[];
  quota: Quota | null;
  busy: boolean;
  notice: Notice | null;
  traces: TraceEntry[];
  setOpen: (open: boolean) => void;
  toggle: () => void;
  clear: () => void;
  clearTraces: () => void;
  ask: (question: string) => Promise<void>;
  askChip: (suggestion: Suggestion) => Promise<void>;
  stop: () => void;
}

let nextId = 1;
let controller: AbortController | null = null;

const NOTICE_CODES = new Set<ErrorCode>(["rate_limited", "daily_cap", "unavailable"]);

/** The last three complete exchanges, as the API expects: user first, assistant last. */
function historyOf(messages: Message[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  for (let i = 0; i + 1 < messages.length; i++) {
    const [user, reply] = [messages[i], messages[i + 1]];
    if (
      user?.role === "user" &&
      reply?.role === "assistant" &&
      reply.status === "done" &&
      !reply.declined
    ) {
      turns.push({ role: "user", text: user.text }, { role: "assistant", text: reply.text });
      i++;
    }
  }
  return turns.slice(-6);
}

export interface RunHandlers {
  onText?: (text: string) => void;
  onCitation?: (citations: string[]) => void;
}

export interface RunResult {
  text: string;
  citations: string[];
  declined: boolean;
  error?: { code: ErrorCode; message: string; resetAt?: number };
}

/**
 * Asks the API once and keeps the shared state (quota, notice, trace) up to date.
 * The panel and the terminal's `ask` both go through here.
 */
export async function runAssistant(
  request: AssistantRequest,
  meta: { question: string; chip: boolean; source: TraceEntry["source"] },
  handlers: RunHandlers = {},
  signal?: AbortSignal,
): Promise<RunResult> {
  const set = useAssistant.setState;
  const entry: TraceEntry = { id: nextId++, at: Date.now(), ...meta };
  set((s) => ({ busy: true, traces: [...s.traces, entry] }));
  const updateEntry = (patch: Partial<TraceEntry>) =>
    set((s) => ({ traces: s.traces.map((t) => (t.id === entry.id ? { ...t, ...patch } : t)) }));

  const result: RunResult = { text: "", citations: [], declined: false };
  const fail = (error: ErrorBody) => {
    result.error = { code: error.code, message: error.message, resetAt: error.resetAt };
    updateEntry({ error: { code: error.code, message: error.message } });
    if (error.quota) set({ quota: error.quota });
    if (NOTICE_CODES.has(error.code))
      set({
        notice: {
          code: error.code as Notice["code"],
          message: error.message,
          resetAt: error.resetAt,
        },
      });
  };

  await requestAnswer(
    request,
    {
      onError: fail,
      onEvent(event) {
        switch (event.type) {
          case "meta":
            set({ quota: event.quota, notice: null });
            updateEntry({ quota: event.quota });
            break;
          case "text":
            result.text += event.text;
            handlers.onText?.(result.text);
            break;
          case "citation":
            result.citations = [...result.citations, event.chunkId];
            handlers.onCitation?.(result.citations);
            break;
          case "done":
            result.declined = event.trace.declined;
            updateEntry({ trace: event.trace });
            break;
          case "error":
            fail({ code: event.code, message: event.message });
            break;
        }
      },
    },
    signal,
  );
  set({ busy: false });
  return result;
}

export const useAssistant = create<AssistantState>((set, get) => {
  async function send(request: AssistantRequest, question: string, chip: boolean) {
    if (get().busy) return;
    const user: Message = {
      id: nextId++,
      role: "user",
      text: question,
      citations: [],
      status: "done",
    };
    const reply: Message = {
      id: nextId++,
      role: "assistant",
      text: "",
      citations: [],
      status: "streaming",
    };
    set((s) => ({ messages: [...s.messages, user, reply] }));
    const patch = (p: Partial<Message>) =>
      set((s) => ({ messages: s.messages.map((m) => (m.id === reply.id ? { ...m, ...p } : m)) }));

    controller = new AbortController();
    const result = await runAssistant(
      request,
      { question, chip, source: "panel" },
      { onText: (text) => patch({ text }), onCitation: (citations) => patch({ citations }) },
      controller.signal,
    );
    controller = null;
    if (result.error && !result.text)
      // A limit or outage shows once, in the notice above the input, not in the thread.
      set((s) => ({
        messages: NOTICE_CODES.has(result.error?.code ?? "invalid")
          ? s.messages.filter((m) => m.id !== reply.id && m.id !== user.id)
          : s.messages.map((m) =>
              m.id === reply.id ? { ...m, status: "error", error: result.error } : m,
            ),
      }));
    else
      patch({
        status: result.error ? "error" : "done",
        error: result.error,
        declined: result.declined,
      });
  }

  return {
    open: false,
    messages: [],
    quota: null,
    busy: false,
    notice: null,
    traces: [],
    setOpen: (open) => set({ open }),
    toggle: () => set((s) => ({ open: !s.open })),
    clear: () => {
      controller?.abort();
      set({ messages: [], busy: false });
    },
    clearTraces: () => set({ traces: [] }),
    ask: (question) =>
      send({ question, history: historyOf(get().messages) }, question.trim(), false),
    askChip: (suggestion) => send({ chipId: suggestion.id }, suggestion.question, true),
    stop: () => controller?.abort(),
  };
});
