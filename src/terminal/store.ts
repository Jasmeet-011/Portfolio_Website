import { create } from "zustand";

/** Text colors the theme check guarantees AA for on the panel. */
export type Tone = "muted" | "link" | "comment" | "tag";

/** A run of output text. `to` opens a workspace route, `href` a page outside the site. */
export interface Segment {
  text: string;
  tone?: Tone;
  to?: string;
  href?: string;
}

export interface Line {
  id: number;
  segments: Segment[];
}

const GREETING: Segment[] = [{ text: "Type help to see what works here.", tone: "muted" }];

let nextId = 1;
const line = (segments: Segment[]): Line => ({ id: nextId++, segments });

interface TerminalState {
  lines: Line[];
  /** Commands entered this session, oldest first. */
  history: string[];
  print: (lines: Segment[][]) => void;
  /** Prints a line that can change later, e.g. a streaming answer. Returns its id. */
  printLive: (segments: Segment[]) => number;
  update: (id: number, segments: Segment[]) => void;
  remember: (command: string) => void;
  clear: () => void;
  /** A fresh session: greeting only, history kept like a shell's history file. */
  reset: () => void;
}

export const useTerminal = create<TerminalState>((set) => ({
  lines: [line(GREETING)],
  history: [],
  print: (lines) => set((s) => ({ lines: [...s.lines, ...lines.map(line)] })),
  printLive: (segments) => {
    const created = line(segments);
    set((s) => ({ lines: [...s.lines, created] }));
    return created.id;
  },
  update: (id, segments) =>
    set((s) => ({ lines: s.lines.map((l) => (l.id === id ? { ...l, segments } : l)) })),
  remember: (command) =>
    set((s) => (s.history.at(-1) === command ? s : { history: [...s.history, command] })),
  clear: () => set({ lines: [] }),
  reset: () => set({ lines: [line(GREETING)] }),
}));
