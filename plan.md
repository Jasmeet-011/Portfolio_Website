# plan.md: VS Code workspace portfolio

Owner: Jasmeet Singh Wadhwa
Executor: Claude Code (read `CLAUDE.md` first)
Repo: github.com/Jasmeet-011/Portfolio_Website, branch `revamp/vscode`

## Status (2026-10-25)

- **Done:** Phases 0 to 4.5. Phase 5 (the assistant) is built and tested against a fake provider and mocked API, and now runs on the Gemini API free tier (Decisions log, 2026-10-20). Free-tier limits recorded (Decisions log, 2026-10-25).
- **Current:** Phase 5 STOP. Waiting on the first real eval run (`npm run eval:assistant`, needs `GEMINI_EVAL_API_KEY` in `.env.local`), the minimal or low thinking decision it produces, and Jasmeet trying to break the assistant.
- **Open `TODO(jasmeet)` items:** add `GEMINI_EVAL_API_KEY` (a separate Google Cloud project) to `.env.local` and run the eval; set the Vercel environment variables and the Upstash integration (see the table in `.env.example`); headline, short bio, long bio; `public/resume.pdf`; periods for all seven projects; AWS certification month; ChainLens `context`; measured results for ChainLens, SilentSOS, LLM Gateway, SynapseMeet; `problem` and `built` for RepoScope, `problem` for CodeMate; whether to link `codemate-chat`; verify Formspree form `mzdarpdv`; review the Phase 3 copy pass and skill descriptions; bring the ChainLens, RepoScope and CodeMate backends back up (down when checked on 2026-10-19, see `liveCheck` in `src/content/projects.ts`).
- **Pushing:** local commits only until Jasmeet says otherwise (see Decisions log).

---

## 1. Goal

Replace the current one-page Lovable site with a portfolio that is a working VS Code workspace in the browser. It should feel like opening Jasmeet's actual repo: files you can open in tabs, a real explorer, a terminal that takes commands, a command palette, themes, and an AI assistant that answers questions about him using only his real content and shows its sources.

Success looks like this:

- A recruiter can learn who Jasmeet is, what he's built, and how to reach him within 30 seconds, even if they never touch a menu.
- An engineer who pokes around finds real depth: deep links, keyboard shortcuts, a terminal with tab completion, an assistant with visible retrieval traces.
- Adding a project or a job is one object in one file.

## 2. The concept: VS Code's own UI

These are the VS Code behaviours Jasmeet wants. They describe the genre, not a spec to copy pixel for pixel.

- **Window chrome:** traffic light dots, a centered search box in the title bar that opens the command palette.
- **Menu bar:** File, Edit, View, Go, Run, Terminal, Help, plus an assistant menu. Menus open dropdowns with shortcuts on the right and actually do things (open tabs, close tabs, toggle sidebar, toggle terminal, zoom, full screen, download resume).
- **Activity bar (left):** Explorer, Search, Source Control, a download/extension slot, the AI assistant, and Settings at the bottom.
- **Explorer:** a list of "files", each one a page of the portfolio, with file-type icons. Clicking opens it as a tab.
- **Tabs and breadcrumbs:** multiple tabs open at once, closable, active tab highlighted, breadcrumb path above the editor.
- **Status bar:** problems count, branch, workspace name, assistant, language mode that changes with the active file (TypeScript React, JSON, Markdown...), encoding, formatter, theme name, live clock. The status bar color follows the theme.
- **Source Control popover:** branch, commits ahead, modified/added/deleted counts, link to GitHub.
- **AI assistant panel (right):** greeting, suggested question chips, input box, a visible message limit, a "can make mistakes" disclaimer.
- **Settings panel:** color theme switcher that recolors the entire UI, quick actions, keyboard shortcut reference, version footer.
- **Command palette:** commands and files, arrow key navigation, Enter to open, Esc to close.
- **Terminal panel:** Terminal / Problems / Output tabs, a prompt, a `help` command, command history with arrow keys.

## 3. Make it ours (important)

VS Code's own UI is the reference. A VS Code-style portfolio is a common genre, so the concept is fair game. What we must not do is clone an existing portfolio, its design system, component structure, animations, or aesthetic, and put Jasmeet's name on it. A clone would also look derivative.

So these common portfolio tropes are **out**:

- One file per page with a deliberately mismatched extension per page (home.tsx, about.html, projects.js, skills.json, experience.ts, contact.css).
- The giant wide display-font name split over two lines with the second line in a bright accent color.
- Role chips plus a rotating typewriter tagline under the name.
- The four-box stats row (years, projects, infinity, arrow).
- Skill percentage bars.
- A custom retro square cursor, a dino game, a themes list built around one's own name.
- Copying any wording, file names, or structure from another portfolio.

What we do instead, grounded in who Jasmeet is (AI engineer focused on AI and agentic backend systems):

| Area | Our version |
|---|---|
| Landing | VS Code's **Welcome tab**, rewritten as Jasmeet's: name, current role, one sentence, and "Start" actions (Open projects, Ask the assistant, Download resume). Featured shipped projects, plus a separate **"Currently building"** slot that shows each featured project with status `building` as a feature branch (`feat/llm-gateway`) with its status visible. It must never look like a finished project. The README is a separate file, not the landing. |
| File tree | A believable engineer's repo with real folders, not one file per section. See section 5. |
| Projects | A `projects/` folder, one file per project, extension matching the project's main language (`llm_gateway.py`, `chainlens.py`, `silentsos.ts`). Each file has a **Preview / Source** toggle like VS Code's Markdown preview. Source view shows the same project as actual code via Shiki. |
| Experience | The **Source Control** view renders the career as a git graph. Each role is a commit, degrees and certifications are tags. `git log` in the terminal prints the same thing. |
| Skills | The **Extensions** view. Each technology is an "installed extension" with a one-line description and "Used in" chips that link to the projects and roles using it. Derived automatically from content, no made-up proficiency numbers. |
| Contact | `contact.http`, styled like a REST Client request: `POST` to the real Formspree endpoint, headers, and the fields as the JSON body. "Send request" submits to Formspree, and the response pane shows the real status line and body (Formspree answers `200 OK` on success) or the real error. |
| Assistant | Grounded answers with **source chips** that open the file the answer came from, plus an **Output > Assistant trace** channel showing retrieved chunks, model, latency, and tokens. This is an AI engineer's portfolio; show the evaluation and observability, not just a chatbot. |
| Run and Debug | A "launch configurations" list of live demos. Selecting one opens the demo or repo, or runs a scripted demo in the terminal. |
| Themes | Our own default theme plus a light theme and a high contrast theme (see section 4). |
| Recruiter escape hatch | A **Plain view** (`/plain`) single-column, printable resume page, reachable from the status bar and the palette. |

## 4. Design tokens (first proposal, refine in Phase 2)

Spend the boldness in one place: blue, and blue marks interactive things only. Everything else stays quiet and close to how a real editor feels. The name renders in one color.

**Default theme, "Workspace Blue" (dark).** VS Code Dark+ greys. Decided 2026-10-18; values in `src/themes/workspace-blue.css`.

| Token | Hex | Use |
|---|---|---|
| `--editor` | `#1E1E1E` | main area, active tab |
| `--chrome` | `#252526` | sidebar, terminal, inactive tabs |
| `--activitybar` | `#333333` | activity bar |
| `--titlebar` | `#1A1A2E` | title bar |
| `--surface` | `#232323` | cards, chips |
| `--hover` / `--selection` | `#2A2D2E` / `#37373D` | list hover, selected row |
| `--border` | `#3C3C3C` | dividers |
| `--text` / `--muted` | `#F5F5F5` / `#A8A8A8` | text |
| `--accent` | `#007ACC` | fills only: status bar, primary button, selected-row accent. White text on it. Never text on dark. |
| `--link`, `--focus` | `#4FC3F7` | links, accent text, highlighted keywords, focus rings |
| `--comment` | `#4EC9B0` | comment-style lines |
| `--tag` | `#C586C0` | secondary dot or tag |
| `--assistant` / `--assistant-text` / `--assistant-panel` | `#4EC9B0` / `#4EC9B0` / `#252526` | assistant panel only (teal, chosen 2026-10-18). Text on the teal fill is `#1E1E1E` (8.18:1). |
| `--success` | `#89D185` | the shipped status dot and success states (VS Code Dark+ green; the palette has none) |

The build's theme check (`scripts/check-themes.mjs`) enforces AA on every text pair and fails if a fill-only token (`accent`, `assistant`, `statusbar`) is used as a text color.

**Type.** IBM Plex Sans for UI chrome and prose, IBM Plex Mono for editor content, code, terminal, and the name on the Welcome tab. One superfamily, engineering feel, clearly different from a wide display face. Self-host via Google Fonts with a system fallback stack. Base size 14px UI, 15px prose, line length under 80 characters.

**Optional theme, "Floodlight" (dark, amber).** Was the default until 2026-10-18.

| Token | Hex | Use |
|---|---|---|
| `--chrome` | `#0D1015` | activity bar, title bar, sidebar |
| `--editor` | `#12161C` | editor background |
| `--surface` | `#1A2029` | hover, inputs, cards |
| `--border` | `#262E3A` | dividers |
| `--text` | `#D5DBE3` | body text |
| `--muted` | `#7C8696` | secondary text, comments |
| `--accent` | `#F0B429` | status bar, active tab rule, primary buttons |
| `--link` | `#4FB6C9` | links, keywords in source view |

**"Daylight" (light).** `--editor #F7F8FA`, `--chrome #ECEFF3`, `--text #1C2330`, `--muted #5B6576`, `--accent #005FB8` (blue family since 2026-10-18; white text on it), `--link #0F6E8C`.

**"High Contrast".** Pure black, white text, yellow focus outlines, mirroring VS Code's accessibility theme.

**"Solarized Dark".** Public palette, included as a familiar alternative.

All colors are CSS variables on `:root[data-theme=...]`. Components never hardcode colors. Theme choice persists in `localStorage` and every first visit gets Workspace Blue, whatever the OS prefers. A saved choice wins, and the theme is applied before first paint.

**Motion.** One orchestrated moment only: on a first visit the workspace "opens" (explorer fills in, Welcome tab slides into place) in under 1.2s. Skipped on return visits and with `prefers-reduced-motion`. Everything else animates only in response to the visitor (menus, tabs, panels).

## 5. Information architecture

Workspace name: `jasmeet-wadhwa`.

```
JASMEET-WADHWA
├── Welcome                  (tab only, opens on load, route /)
├── README.md                → short intro, stack summary, links      /readme
├── about.py                 → bio, now, education, certs, publication /about
├── projects/
│   ├── archive/             (collapsed by default; archived projects)
│   │   ├── codemate.js                                                /projects/codemate
│   │   └── reposcope.js
│   ├── agentguard.py        → one file per project                    /projects/agentguard
│   ├── chainlens.py
│   ├── llm_gateway.py
│   ├── silentsos.ts
│   └── synapsemeet.py       (generated from src/content/projects.ts, see section 10)
├── contact.http             → contact form as an HTTP request         /contact
└── resume.pdf               → PDF preview + download                  /resume (shown once public/resume.pdf exists)
```

Activity bar views:

1. **Explorer:** the tree above, folders collapsible, active file highlighted.
2. **Search:** real full-text search across all content, results grouped by file, clicking jumps to the match.
3. **Source Control:** career git graph (Experience). Route `/experience`.
4. **Run and Debug:** demo launch configurations.
5. **Extensions:** skills. Route `/skills`.
6. **Assistant:** opens the right-hand panel.
7. **Settings (bottom):** themes, zoom, toggles, shortcut reference, version info.

Panel (bottom): Terminal, Problems, Output (Output has an "Assistant trace" channel).

Every file and view has a URL. Opening a URL opens the workspace with that tab active. Browser back/forward moves between tabs.

## 6. Content model (single source of truth)

All facts live in `src/content/*.ts`. Everything else derives from it: explorer, routes, palette entries, terminal output, search index, sitemap, Plain view, assistant context.

```ts
// projects.ts
type Project = {
  slug: string;            // "llm-gateway"
  name: string;            // "LLMGateway"
  fileName: string;        // "llm_gateway.py"
  language: "Python" | "TypeScript" | "JavaScript" | "Go" | "Solidity" | string;
  status: "shipped" | "building";
  featured: boolean;       // shows on Welcome tab; "building" ones go in the "Currently building" slot
  archived: boolean;       // projects/archive/; never featured, not in suggested questions
  period: string;          // "Mon YYYY to Mon YYYY" or "Mon YYYY to Present"; TODO(jasmeet) when unknown
  oneLiner: string;
  problem: string;
  built: string[];         // what Jasmeet actually did
  results?: string[];      // only real, verifiable outcomes
  stack: string[];         // feeds the Extensions view
  links: { github?: string; live?: string; demo?: string; paper?: string };
  context?: string;        // "Built for the Gemini Live API hackathon, Live Agent track."
};

// experience.ts
type Role = {
  slug: string;
  company: string;
  title: string;
  kind: "job" | "internship" | "teaching" | "research";
  start: string;           // "2026-08"
  end: string | null;      // null = present
  location?: string;
  summary: string;
  highlights: string[];
  stack: string[];
  url?: string;
};

// skills.ts: categories and one-line descriptions only.
// "Used in" is computed from projects[].stack, projects[].language and roles[].stack.

// profile.ts: name, headline, shortBio, longBio, location, availability?, email (no photo, no phone)
// education.ts: degrees, certifications, publications
// links.ts: github, linkedin, email, resume, formspreeId, others
```

Git graph generation: roles sorted by start date become commits (`short hash = first 7 chars of sha1(slug)`, message `title @ company`), lanes by `kind`, degrees and certifications become tags. No fake commits.

## 7. Feature specs

### 7.1 Menus

Every item works or is not shown. No dead items.

- **File:** Open File (palette in file mode), Open Recent (last 5 tabs), Close Editor, Close All Editors, Download Resume.
- **Edit:** Find in Workspace (Search view), Copy Link to This File.
- **View:** Command Palette, Explorer, Search, Source Control, Run, Extensions, Assistant, Terminal, Output, Toggle Sidebar, Zen Mode, Zoom In, Zoom Out, Reset Zoom, Full Screen.
- **Go:** Go to File, Go to Project, Back, Forward.
- **Run:** Start Demo (submenu from launch configs), Run in Terminal.
- **Terminal:** New Terminal, Clear Terminal.
- **Help:** Welcome, Keyboard Shortcuts, View Source on GitHub, Plain View, About.
- **Assistant:** Open Chat, Clear Conversation, Show Trace.

### 7.2 Keyboard shortcuts

Ctrl/Cmd+P go to file, Ctrl/Cmd+Shift+P command palette, Ctrl/Cmd+B toggle sidebar, Ctrl+` toggle terminal, Ctrl/Cmd+Shift+F search, Ctrl/Cmd+Shift+G source control, Ctrl/Cmd+Shift+X extensions, Ctrl/Cmd+Shift+I assistant, Ctrl/Cmd+W close tab, Ctrl+Tab next tab, Esc close overlay. Never hijack shortcuts while focus is in a text input. Show Cmd on macOS and Ctrl elsewhere.

### 7.3 Command palette

`cmdk`. Two modes like VS Code: no prefix lists files, `>` prefix lists commands. Fuzzy search, recent items first, shows shortcut hints.

### 7.4 Tabs, breadcrumbs, editor

- Open tabs persist in `sessionStorage` for the session.
- Middle click closes a tab. Overflowing tabs scroll horizontally.
- Breadcrumbs reflect the path (`jasmeet-wadhwa › projects › llm_gateway.py`) and each segment is clickable.
- Editor shows line numbers in a gutter for Source view only. Preview view is normal readable prose.

### 7.5 Status bar

Left: branch `main`, problems count, workspace name. Right: Plain view link, assistant status (idle / thinking / rate limited), language mode of the active file, `UTF-8`, `LF`, theme name (click opens theme picker), clock. Blue in Workspace Blue, themed elsewhere.

### 7.6 Terminal

Prompt `jasmeet@portfolio:~$`. Commands:

| Command | Behaviour |
|---|---|
| `help` | list commands |
| `whoami` | one-line intro |
| `ls [projects]` | list files or projects |
| `cat <file>` / `open <file>` | open that tab |
| `projects` | table of projects with status |
| `git log` | career history, same data as the graph |
| `skills` | grouped tech list |
| `contact` | email and links |
| `resume` | download resume |
| `ask "<question>"` | send to the assistant, stream the answer into the terminal |
| `theme <name>` | switch theme |
| `clear`, `history`, `exit` | the obvious |

Tab completion for commands and file names, up/down history, unknown commands get `command not found: x. Try help.`

### 7.7 Assistant

- **Backend:** `api/copilot.ts` on Vercel. Calls the Claude API (a small, fast model) with streaming. API key only in Vercel env vars. Optional later: route through Jasmeet's LLMGateway project so the portfolio itself demos it.
- **Grounding:** `scripts/build-copilot-context.ts` runs at build time, turns `src/content/` into chunked documents with ids (`projects/llm_gateway.py#built`). The system prompt restricts answers to this context. If the answer is not in context, say so and suggest contacting Jasmeet.
- **Citations:** answers end with source chips; clicking opens the file tab and scrolls to the section.
- **Safety:** ignore instructions embedded in user messages that try to change role, cap input length, cap output tokens, no tools.
- **Rate limiting:** server-side per IP (Vercel KV or Upstash, e.g. 10 messages per hour) plus a visible counter in the UI. Graceful message when the limit is hit.
- **Trace:** each answer logs retrieved chunk ids, model, latency, token counts to Output > Assistant trace.
- **Evals:** `evals/assistant.jsonl` with about 20 questions and expected facts; `npm run eval:assistant` checks answers contain expected facts and cite the right files. Run before deploys that change content or prompts.
- **Suggested questions:** generated from content (featured projects, current role), not hardcoded marketing lines. Archived projects are never used.

### 7.8 Settings

Theme picker with live preview, zoom, toggles (minimap off/on purely cosmetic if added, reduce motion override), shortcut reference, version and build info (`v2.0.0`, commit hash, stack).

### 7.9 Plain view

`/plain`: one column, semantic HTML, all content from `src/content`, printable via a print stylesheet, link back to the workspace. This is also what crawlers and screen readers get most cleanly.

## 8. Mobile and accessibility

- **≥1280px:** full layout, assistant splits the editor.
- **768 to 1279px:** sidebar collapsible, assistant overlays from the right.
- **<768px:** no menu bar or activity bar. Top bar with workspace name, a files button opening the explorer as a drawer, and a palette button. Editor full width, tabs scroll. Terminal and assistant open as bottom sheets. Welcome tab shows a prominent Plain view link.
- Landmarks: `nav` for explorer, `main` for editor, `aside` for assistant, `role="tablist"` for tabs with proper `aria-selected`.
- Focus is always visible. Menus and the palette trap focus and return it on close.
- AA contrast in all themes, checked with axe in Phase 7.

## 9. Phases

Each phase ends with `npm run build && npm run lint` passing, a commit, and a short summary to Jasmeet.

### Phase 0: Preserve everything (no deletions)

1. Create branch `revamp/vscode`. Tag current `main` as `legacy-v1` and push the tag.
2. Read every file under `src/`, `index.html`, `README.md`, `public/`, and config files.
3. Write a legacy content archive (kept outside the repo) with these sections, copying text **verbatim**:
   - Identity: name, title, tagline, bio paragraphs.
   - Links: every URL found (GitHub, LinkedIn, project repos, resume Drive link), every email address, Formspree form id.
   - Projects: per project, name, full description, tech list, links, image URLs.
   - Experience: per role, title, company, dates, full description.
   - Skills: all lists as they appear.
   - Education, certifications, anything else found.
   - SEO: page title, meta description, favicon, robots.txt contents.
   - Footer and miscellaneous copy.
   - Assets: list of files in `public/` and whether they are kept.
   - **Conflicts and stale info:** things that look outdated or inconsistent, without resolving them.
   - **New facts to confirm:** copy section 10 of this plan here.
4. Verify: a small script greps every URL and email in the old `src/` and confirms each appears in the archive. Report the result.
5. Commit `phase 0: preserve legacy content`.

**STOP.** Show Jasmeet the conflicts list and wait for an explicit "confirmed, go ahead" before Phase 1.

### Phase 1: Clean slate and scaffold

1. Delete everything except: `.git/`, `docs/`, `.claude/`, `CLAUDE.md`, `plan.md`. Remove both lockfiles and all Lovable dependencies. No profile photo is kept.
2. Scaffold Vite + React + TS (strict) + Tailwind, ESLint, Prettier, path alias `@/`.
3. Install: `zustand`, `react-router-dom`, `cmdk`, `lucide-react`, `shiki` (lazy imported only).
4. Create `src/content/*.ts` with types from section 6, filled from the resolved facts in section 10. Unknowns become `TODO(jasmeet)`.
5. Add `vercel.json` with SPA rewrites, `.env.example` with `ANTHROPIC_API_KEY=`.

Done when: `npm run dev` shows a blank themed page, content types compile, no unused dependencies.

### Phase 2: Workspace shell

Title bar, menu bar (structure only, wired in Phase 4), activity bar, sidebar with Explorer, tab strip, breadcrumbs, editor area, bottom panel container, status bar. Zustand store. Router mapping every file to a URL. Theme system with all four themes and the picker.

Done when: clicking explorer files opens and closes tabs, URLs update, back button works, themes swap every color, layout matches the breakpoints in section 8.

Playwright (dev dependency) loads the app in a real browser, fails on any console error or warning, and screenshots desktop (1440px) and mobile (375px) for every theme. Review the screenshots and fix what looks wrong before showing them.

**STOP.** Jasmeet reviews the look on desktop and phone, with the screenshots, before content work.

### Phase 3: Content files

Welcome tab, README.md, about.py, projects folder with Preview/Source toggle, Source Control git graph, Extensions skills view, contact.http with working Formspree submit, resume.pdf preview and download, Plain view.

Copy pass, before rendering, for Jasmeet to review:
- Every project `oneLiner` under 20 words. Numbers move out of one-liners into `results`.
- Every `built` bullet rewritten in first person ("I built...", "I chose...").
- One plain line per skill in `skills.ts` describing the technology itself (not Jasmeet), written by Claude.

Done when: every piece of content in `src/content` is visible somewhere, adding a dummy project to `projects.ts` makes it appear in explorer, palette, search, Extensions "Used in", sitemap, and Plain view with no other edits (then remove the dummy).

### Phase 4: Interactions

All menus wired, command palette, keyboard shortcuts, Search view, Run and Debug view, Settings panel, terminal with every command in 7.6, Open Recent, zoom, Zen mode, full screen.

Done when: every menu item and shortcut does what it says, Help > Keyboard Shortcuts matches reality.

### Phase 5: Assistant

API route, build-time context script, streaming UI panel, source chips, `ask` in terminal, rate limiting, Output trace, eval set and runner.

Done when: eval pass rate is at least 90%, off-topic and injection test prompts are declined, the key never appears in the client bundle (`grep` the build output).

**STOP.** Jasmeet tries to break the assistant.

### Phase 6: Mobile and accessibility pass

Implement the <768px layout fully, focus management, ARIA, reduced motion, run axe on every route.

### Phase 7: Polish, SEO, deploy

Per-route `<title>` and meta description, Open Graph image, generated `sitemap.xml`, `robots.txt`, prerender routes if feasible so content is in the HTML. Lighthouse 90+ on performance, accessibility, best practices, SEO for `/` and `/plain`. New `README.md` for the repo. Deploy to Vercel, set env vars, point the domain if Jasmeet has one.

### No 3D

Decided: the site commits fully to the VS Code direction. No Three.js, WebGL, or 3D scenes in any phase. If an idea needs 3D to work, it's out of scope.

## 10. Resolved facts (source of truth)

Resolved by Jasmeet on 2026-10-18 after the Phase 0 review. **The resume wins over every other source.** "The resume" means what the `redesign-v1` tag recorded from it. Only what is listed here goes on the site, in `src/content/`, or in the assistant's context. A `TODO(jasmeet)` stays a `TODO(jasmeet)` until Jasmeet supplies the value.

### Identity and contact

| Field | Value |
|---|---|
| Name | Jasmeet Singh Wadhwa |
| Positioning | AI engineer focused on AI and agentic backend systems (framing, not a job title) |
| Headline | TODO(jasmeet). "Full Stack Developer" is dropped. |
| Bio | TODO(jasmeet) |
| Email | `j.wadhwa.dev@gmail.com`, the only public address |
| Location | New York, NY |
| Phone | none on the site |
| Photo | none on the site |
| GitHub | `https://github.com/Jasmeet-011` |
| LinkedIn | `https://www.linkedin.com/in/jasmeet-singh-wadhwa/` |
| Site source | `https://github.com/Jasmeet-011/Portfolio_Website` |
| Resume | `public/resume.pdf`, TODO(jasmeet) to add. Until it exists, resume actions follow the "works or is not shown" rule in 7.1. |
| Live URL | decided in Phase 7 |

### Experience

Newest first. Titles and dates from the resume.

| Title | Company | Kind | Dates | Stack |
|---|---|---|---|---|
| Research Engineer | NYU, Prof. Dennis Shasha | research | 2026-08 to Present | SQLite (the only tool the resume names) |
| Teaching Assistant, Object-Oriented Programming | NYU Tandon | teaching | 2025-09 to 2026-05 | none |
| Software Engineer Intern | Qualitest | internship | 2025-06 to 2025-08 | Python, FastAPI, MongoDB |

- **Research Engineer** summary: "I test whether a config-first operations engine can take on a logistics vertical without changes to its core."
- **Teaching Assistant** summary: "I held weekly office hours and reviewed student code for object-oriented design." (From the May 2026 resume.)
- **Qualitest** summary: "I worked on the prompts behind an LLM test-case generator and moved its templates into a service that updates without redeploys." Highlights, the resume wording recorded in `redesign-v1` commit `2ff9f3d`:
  - "Traced about half of the off-scenario steps from COCO's LLM test-case generator to conflicting prompt quotas, and rewrote the prompt."
  - "Built a FastAPI + MongoDB prompt config service for template updates with zero redeploys, and added schema validation to CI that cut manual verification 30%."

### Education, certification, publication

Exactly as on the resume.

- MS Computer Science, NYU Tandon School of Engineering, 2024-08 to 2026-05, GPA 3.9.
- BE Computer Science, SRM Institute of Science and Technology, 2020-09 to 2024-06, GPA 9.8/10.
- AWS Certified Solutions Architect, Associate (Amazon Web Services): `https://www.credly.com/badges/0f2262c3-59d5-483b-8860-7b3e987382e3/public_url`. This is the only certification.
- "A Hybrid Gradient Boosting Algorithm for Dynamic Pricing using a Custom Dataset", 2024 5th International Conference on Image Processing and Capsule Networks (ICIPCN), IEEE: `https://ieeexplore.ieee.org/abstract/document/10660680`.

### Projects

Describe each project only from what its repo shows. File extensions follow each repo's main language on GitHub (checked 2026-10-18). Every `period` is TODO(jasmeet): no source gives project dates.

Placement (decided 2026-10-18): AgentGuard, ChainLens and SilentSOS are featured shipped work. LLM Gateway is featured in the "Currently building" slot as `feat/llm-gateway`. SynapseMeet is not featured. RepoScope and CodeMate are archived.

| Project | File | Language | Status | Links | Notes |
|---|---|---|---|---|---|
| AgentGuard | `agentguard.py` | Python | shipped | github `Jasmeet-011/AgentGuard` | A single pipeline (policy guard, decompose, retrieve, fuse, rerank, generate, verify) over 10 SEC Form ADV brochures. Results only with their caveat (8 held-out questions). |
| ChainLens | `chainlens.py` | Python | shipped | github `Jasmeet-011/On-Chain-Portfolio`, live `https://on-chain-portfolio.vercel.app` | Portfolio across Aptos and Solana wallets, FastAPI backend. `context`: TODO(jasmeet). |
| SilentSOS | `silentsos.ts` | TypeScript | shipped | github `Jasmeet-011/Silentsos` | `context`: "Built for the Gemini Live API hackathon, Live Agent track." No timing claims until measured. |
| LLM Gateway | `llm_gateway.py` | Python | building | github `Jasmeet-011/LLMGateway` | Built so far: unified schema, provider error types, adapter interface, mock provider (45 passing tests). Everything else is planned. No performance numbers. |
| SynapseMeet | `synapsemeet.py` | Python | building | github `Jasmeet-011/SynapseMeet` | Backend services and AI pipeline exist as a working skeleton. Nothing measured. |
| RepoScope | `reposcope.js` | JavaScript | shipped | github `Jasmeet-011/RepoScope`, live `https://repo-scope.vercel.app` | "Pulls a repository's stars, forks, open issues and languages from the GitHub API, and asks Gemini for code suggestions." |
| CodeMate | `codemate.js` | JavaScript | shipped | github `Jasmeet-011/Codemate`, live `https://codemate-taupe.vercel.app` | Pick a language and ask Gemini. An Express API with a per-IP rate limit saves each question and answer to MongoDB for a history view. |

- Dropped: WalkWise, CloudMart.
- `Jasmeet-011/codemate-chat` also exists: a later TypeScript chat UI with an Express backend and no database. Not linked. TODO(jasmeet): keep it unlinked, or link it as well?
### Skills

Derived only from `projects[].stack`, `projects[].language` and `roles[].stack`. A technology no project or role uses does not appear. Nothing comes from the old Skills section or from a separate skills list. Each skill gets one plain line describing the technology, written in Phase 3 and reviewed by Jasmeet.

### Images and contact

- No stock images anywhere. The only images allowed are screenshots of Jasmeet's own projects.
- `contact.http` posts to Formspree form `mzdarpdv`. TODO(jasmeet): verify the form still receives submissions.

## 11. Content Jasmeet still needs to write

- The headline and a two-sentence bio in his own voice.
- `public/resume.pdf`.
- Project periods for all seven projects.
- Review of the Phase 3 copy pass and skill descriptions.
- ChainLens `context`, if there is one.
- A real result for each featured project where none exists yet (ChainLens, SilentSOS, LLM Gateway, SynapseMeet have none measured).
- Whether to link `codemate-chat`.
- Confirm Formspree form `mzdarpdv` works.

## 12. Open decisions

- Whether the assistant routes through LLMGateway (great demo, more moving parts).
- Custom domain.

Decided: the default theme is "Workspace Blue" (section 4). Floodlight stays as an optional theme.

## 13. Decisions log

Where an entry here conflicts with an earlier section of this file or with `CLAUDE.md`, this log wins. Decisions already written into earlier sections (Workspace Blue as the first-visit default applied before first paint, the teal assistant and green shipped dot, featured and "Currently building" placement, the collapsed `projects/archive/` folder) are not repeated here.

| Date | Decision |
|---|---|
| 2026-10-18 | **One-color name, no highlight token.** The name renders in a single color with no pink or accent split. The `--highlight` token is dropped from every theme and must not come back. |
| 2026-10-18 | **Form fields use `--input`.** Every theme defines an `--input` token for text fields and textareas (Workspace Blue `#313131`), separate from `--surface`, and `scripts/check-themes.mjs` checks text on it for AA. |
| 2026-10-18 | **"Built" covers only Jasmeet's own commits.** Every `built` bullet is checked against `git shortlog` / `git log --author` on that project's repo, and work by others is not claimed. For SilentSOS, "I built" covers only Jasmeet's commits, and Tejas's pull request #1 gets a one-line credit linked to the PR. This adds an optional `credits` field to `Project` in section 6. |
| 2026-10-18 | **LLM Gateway keeps "I built"** in its `built` bullets, limited to what exists in the repo (section 10). |
| 2026-10-19 | **Commit locally, never push** to any remote (branches or tags) until Jasmeet says so. This overrides any push step elsewhere in this file or in `CLAUDE.md`. |
| 2026-10-19 | **Shortcuts the browser keeps are replaced** (overrides 7.2): Alt+W closes a tab, Alt+] and Alt+[ move to the next and previous tab, F1 opens the command palette as well as Ctrl/Cmd+Shift+P. The assistant's shortcut is decided in Phase 5. |
| 2026-10-19 | **No browser zoom override** (overrides 7.1 and 7.8): Ctrl+= and Ctrl+- stay the browser's. Workspace zoom lives in the View menu, the palette and Settings only. |
| 2026-10-19 | **Cut:** Run in Terminal, scripted terminal demos and the minimap toggle. `ask` arrives with the assistant in Phase 5. `resume` and File > Download Resume appear once `public/resume.pdf` exists. |
| 2026-10-19 | **No Run and Debug view and no Run menu for now** (overrides sections 3, 5 and 7.1). Each project with a live link instead gets a palette command, "Open ChainLens live", with archived projects labeled as archived. A demo is linked only after a recorded check (`liveCheck` in `src/content/projects.ts`) shows it loads and works. On 2026-10-19 all three (ChainLens, RepoScope, CodeMate) were down, so none is linked. Revisit the Run and Debug view when another project has a running demo. |
| 2026-10-19 | **Accepted from Phase 4:** Ctrl/Cmd+Shift+P and F1 open the palette from text fields too (overrides 7.2 for those keys only, since neither means anything while typing). Commands that can't act right now are hidden from menus and the palette but still listed in the shortcut reference. Go has Next Editor and Previous Editor; View has Settings. |
| 2026-10-19 | **A failed live demo is linked nowhere.** A project's live app appears only while its last `liveCheck` passed: project pages, their Source view, Plain view, the palette and the terminal all go through `shownLinks()` in `src/lib/projects.ts`. Links come back on their own when a new check passes. |
| 2026-10-19 | **No Output tab until Phase 5.** The panel shows Terminal and Problems only. No placeholder text about later phases is ever visible to visitors. |
| 2026-10-19 | **macOS traffic lights** (red, yellow, green) at the top left of the desktop title bar, from `--window-close`, `--window-minimize` and `--window-zoom` in every theme. Phones never show them. Replaces the grey dots from Phase 2. |
| 2026-10-19 | **Type scale** (overrides "Type" in section 4): prose and Preview 16px with a 1.65 line height, code and Source view 15px, terminal 14px, UI chrome (menus, tabs, explorer, status bar, palette) 14px, secondary details 12 to 13px. No text below 12px anywhere. The status bar drops the clock below 640px so it fits at 14px. |
| 2026-10-19 | **Logo:** an original mark, never the VS Code logo or anything like it (Microsoft's trademark). Workspace Blue, readable at 16px, used as the favicon (SVG plus PNG fallback and an Apple touch icon), in the title bar and in Help > About. All of it is generated from `src/assets/logo/marks.json` by `scripts/build-favicon.mjs`. Options A (JW monogram), B ([J] bracket) and C (J_ prompt) are in `docs/logo/`. Choice pending; A is in place provisionally. |
| 2026-10-19 | **Terminal additions:** `neofetch`, `open <github|linkedin|email|project-slug>` (a project opens its live app only while its check passes, otherwise its GitHub repo; files still win, and `cat` stays files only), `education`, `certs` (certification and the IEEE paper), `echo`, `date`, `pwd`, and `sudo` with a short refusal. All output comes from `src/content`. |
| 2026-10-19 | **Every commit goes through `scripts/commit.sh`**, which runs the full gate (format, theme contrast, types, build, lint with zero warnings, unit tests, e2e) and stops at the first failure. No commit while any step fails. |
| 2026-10-20 | **Logo is option C, the `J_` prompt mark** (`"chosen": "prompt"` in `src/assets/logo/marks.json`). It is the favicon (SVG, 32px PNG, Apple touch icon), the title bar mark, the mark in Help > About and Settings, and `neofetch` draws it as `J_` in figlet's standard font. A unit test keeps the terminal art and the chosen mark in step. Options A and B stay in `docs/logo/` for the record. |
| 2026-10-20 | **Assistant model:** Claude Haiku 5.5, `claude-haiku-5-5` (checked against Anthropic's models overview on 2026-10-20), effort `low`, 1024 output tokens, through the official SDK. Every provider call goes through one interface in `api/_lib/provider/`; routing through LLM Gateway is a one-line change in `api/_lib/provider/index.ts`. |
| 2026-10-20 | **Grounding without retrieval** (overrides 7.7's retrieval and "retrieved chunks"): `src/content` becomes 29 chunks (about 4K tokens) with ids like `projects/agentguard.py#built`, and every request sends all of them as one document with the API's citations on and a prompt-cache breakpoint. The API ties each citation to a real chunk; source chips open that file at that section. The trace shows cited chunks. Revisit if the content grows past about 50K tokens. |
| 2026-10-20 | **Limits:** 10 questions an hour per visitor and 300 a day overall, on Upstash. The visitor key is a salted SHA-256 of the IP from `x-vercel-forwarded-for` or `x-real-ip`, never a client-supplied `x-forwarded-for` (a unit test proves a spoofed one doesn't bypass the limit). On Vercel the assistant fails closed without Upstash or the salt. Input up to 500 characters, three earlier exchanges, 8 KB bodies. |
| 2026-10-20 | **Suggested-question answers are cached** for 7 days in Upstash, keyed by content version, model, thinking mode and prompt version. Repeat clicks make no model call and use no hourly question (a looser 60-an-hour limit still applies). Only complete, on-topic answers are cached. |
| 2026-10-20 | **Anonymous question log:** every answered question is stored in Upstash for 30 days with its timestamp, whether it was a chip, whether it was declined, and token counts. No IP, no IP hash, no session id, and nothing from the answer beyond counts. The panel's privacy note says this plainly. `npm run assistant:questions` exports the log to `evals/inbox/` (git-ignored) with eval-case stubs. |
| 2026-10-20 | **Assistant shortcut:** Ctrl+Alt+I (Cmd+Ctrl+I on macOS), outside text fields only, like VS Code's chat. |
| 2026-10-20 | **The Output tab is back** with an Assistant trace channel, and View > Output (supersedes "No Output tab until Phase 5"). The trace shows model, effort, thinking, context version, cited chunks, tokens, time to first words, total time and quota, from this tab's own requests only. |
| 2026-10-20 | **Thinking on or off** is measured in the eval run (both at low effort) and the default is whichever has the faster time to first words at an equal pass rate. Until that run, the default is off (`DEFAULT_THINKING` in `api/_lib/deps.ts`; `ASSISTANT_THINKING` overrides it). |
| 2026-10-20 | **Eval pass bar** (overrides 7.7's 90%): at least 90% overall and 100% on the safety categories (traps, off-topic, injection), scored deterministically by `evals/score.ts`. The eval calls the real API, so it runs on demand, never in the commit gate; the gate's e2e tests mock `/api/copilot`. |
| 2026-10-20 | **The assistant works on phones now** as a bottom sheet (over the editor from 768px, beside it from 1280px). Phase 6 polishes it. |
| 2026-10-20 | **The assistant runs on the Gemini API free tier** (supersedes "Assistant model"): no paid API. Model `gemini-3.5-flash-lite` (stable; checked against Google's models page on 2026-10-20: 1,048,576 input and 65,536 output tokens, structured output and thinking supported), through `@google/genai` `generateContentStream` with SDK retries off, 1024 output tokens. Rule: 3.5 Flash-Lite, unless `gemini-3.1-flash-lite`'s free RPD is at least double, in which case 3.1, provided it passes the eval bar. `ASSISTANT_PROVIDER=gemini\|anthropic` (default `gemini`) picks a spec in `api/_lib/provider/index.ts`; the Claude provider stays as the alternative, keyed by `ANTHROPIC_API_KEY`. Google's rate-limits page (updated 2026-10-15) no longer publishes free-tier numbers and AI Studio needs sign-in, so the numbers come from Jasmeet. Free-tier limits are recorded in "Free-tier limits" (2026-10-25); Google changes them without notice. Free-tier prompts may be used by Google to improve its products (Google's pricing page, 2026-10-19). |
| 2026-10-20 | **Citations by structured output** (supersedes the API citations in "Grounding without retrieval"; grounding is still every chunk on every request). Gemini has no citations feature, so the system instruction carries each chunk as `<section id="...">` and the reply is JSON, `{"answer": ..., "sources": [...]}`, with `sources` limited by the schema to an enum of the real chunk ids. The server checks every id against the chunk list again and drops unknown ones, so every source chip opens a real section. An incremental parser (`api/_lib/provider/json-answer.ts`) streams the answer's words before the object closes. Prompt version 2. |
| 2026-10-20 | **Limits follow the free tier** (supersedes the daily figure in "Limits"; the hourly per-visitor limit and the IP rules stand). The daily cap is about 80% of the model's free RPD, and a global per-minute limit is about 80% of its free RPM: both derived from `freeTier`, or set by `ASSISTANT_DAILY_CAP` and `ASSISTANT_PER_MINUTE`. On Vercel the assistant fails closed until one of those is known. The daily cap resets at midnight Pacific, like Google's quota. A per-day quota 429 from Gemini shows "The assistant is done for today" and latches until midnight Pacific, so the site stops calling Google. A per-minute 429 (or any 429 it can't place) shows "The assistant is busy. Try again in a minute." Visitors never see a raw provider error. With Claude: 300 a day, 60 a minute. |
| 2026-10-20 | **Evals use a separate project's key.** `npm run eval:assistant` reads `GEMINI_EVAL_API_KEY` and falls back to `GEMINI_API_KEY` (with a warning) only when it's missing, so eval runs never spend the site's quota and the cap keeps no room for them. The run paces itself under the per-minute limit (`ASSISTANT_EVAL_RPM`, else 80% of the free RPM, else 8), waits out a per-minute 429, and stops on a per-day one. It fails if any source chip doesn't map to a real chunk, and reports dropped ids. |
| 2026-10-20 | **Thinking minimal or low** (supersedes "Thinking on or off"). Gemini 3.5 Flash-Lite can't turn thinking off, so the eval compares `minimal` and `low`, and the default is whichever has the faster time to first words at an equal pass rate. Until that run, the default is `minimal` (`defaultThinking` in `api/_lib/provider/index.ts`; `ASSISTANT_THINKING` overrides it). The trace shows thinking tokens and leaves out effort, which Gemini doesn't have. |
| 2026-10-20 | **Privacy note** in the panel: "Answers come only from this workspace and can be wrong. Questions are sent to Google's Gemini API free tier, and Google may use them to improve its products." followed by the 30-day anonymous question log and IP-hash lines. |
| 2026-10-20 | **Gate secret check** covers the Gemini keys: the names `GEMINI_API_KEY` and `GEMINI_EVAL_API_KEY`, Google's key shape (`AIza` plus 35 characters) and each key's value from `.env.local`, as well as the Anthropic ones. A failed search fails the gate. The gate still runs only the fake provider and a mocked `/api/copilot`. |
| 2026-10-25 | **Free-tier limits**, read by Jasmeet in AI Studio on 2026-10-25 for the site's project ("Gemini Project"), text-out models: `gemini-3.5-flash-lite` RPM 15, TPM 250K, RPD 500; `gemini-3.1-flash-lite` RPM 15, TPM 250K, RPD 500. The limits are identical, so the model stays `gemini-3.5-flash-lite` (3.1 would need at least double the RPD). Recorded in `freeTier` with `readOn: "2026-10-25"`. The site's limits follow from it at 80%: a daily cap of 400 and a global per-minute limit of 12, with no `ASSISTANT_DAILY_CAP` or `ASSISTANT_PER_MINUTE` needed on Vercel (either can still lower them). **TPM doesn't bind:** the request the site sends counts 4,373 input tokens for a typical question (system instruction with all 29 chunks 4,057, reply schema 308, question 8), measured on 2026-10-25 with the SDK's local Gemma 3 tokenizer, the one it uses for Gemini models. Visitor text is held to an 8 KB body, so a request is at most about 12.6K input plus 1,024 output tokens. At 12 a minute that is about 65K tokens a minute typically and at most about 163K, under 250K. The first eval run's `promptTokenCount` checks the count against Google's own. Evals pace at 80% of the free RPM, 12 a minute, under the eval project's 15 if its free tier matches. |
