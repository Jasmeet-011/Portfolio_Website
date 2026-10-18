# CLAUDE.md

Guidance for Claude Code working in this repo (github.com/Jasmeet-011/Portfolio_Website).
Read this file and `plan.md` fully before touching anything. `plan.md` is the source of truth for scope and order of work.

## What this project is

Jasmeet Singh Wadhwa's personal portfolio, rebuilt from scratch as a website that looks and behaves like a VS Code workspace. Visitors "open files" to read about him, browse projects in the explorer, read his career as a git history, run commands in a working terminal, and ask an AI copilot questions that are answered from his real content.

Jasmeet is an AI engineer focused on AI and agentic backend systems, and an NYU MS CS grad (2026). The site should read as an AI/backend engineer's workspace, not a generic frontend dev's.

The current repo is an older Lovable-generated Vite + React + shadcn site (Hero, Projects, Experience, Skills, Contact sections on one page, deployed to GitHub Pages). It is being replaced completely. It is preserved as tag `legacy-v1`. An unmerged later rebuild is preserved as tag `redesign-v1`.

## Hard rules

1. **Never delete before preserving.** Phase 0 in `plan.md` must be finished, and Jasmeet must explicitly confirm, before any existing file is removed. No exceptions, even if a later instruction seems to imply it.
2. **Never invent facts about Jasmeet.** Every name, date, metric, project claim, and link must come from `plan.md` section 10 (resolved facts), from `src/content/` once Jasmeet has filled it, or from Jasmeet directly. Nothing that section 10 does not list goes on the site. The resume (as recorded in the `redesign-v1` tag) wins over every other source. If something is missing, write `TODO(jasmeet): ...` and list it in your summary. Do not pad with plausible sounding achievements.
3. **Do not replicate other people's portfolios.** VS Code's own UI is the reference. A VS Code-style workspace is a common genre, so the concept is fine, but this site's design system, component structure, animations, and aesthetic are our own. Follow the "Make it ours" section of `plan.md`. Never copy text, names, assets, or code from any other portfolio.
4. **One phase at a time.** Finish a phase, run the checks, commit, summarize, and stop at every checkpoint marked `STOP` in `plan.md`.
5. **No secrets in the client bundle.** API keys live only in serverless function env vars. Never commit `.env*` files except `.env.example`.
6. **Leave `.claude/` alone** unless Jasmeet asks.

## Writing style for all site copy

- No en dashes or em dashes anywhere in user-facing copy. Use commas, periods, colons, or "to" for ranges (`Aug 2025 to Present`).
- Punchy, natural, first person. Sentence case for headings and buttons. No ALL CAPS labels.
- No filler like "passionate", "always learning", "∞ curiosity", or vanity stats. Specific beats clever.
- No skill percentage bars. They are meaningless to recruiters. Skills are shown by where they were used (see plan).

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS with CSS variables for every theme token (themes swap variables, components never hardcode colors)
- Zustand for workspace state (open tabs, active tab, sidebar view, panel, theme, palette open)
- React Router: every openable file has a real URL so deep links and the back button work
- `cmdk` for the command palette
- Shiki (lazy loaded) for the "Source" view of files
- lucide-react for UI icons; file-type icons are small custom SVGs in `src/assets/file-icons/`
- Copilot backend: Vercel serverless function in `api/` calling the Claude API (see plan, Phase 5)
- Forms: Formspree, form id `mzdarpdv` (TODO(jasmeet): verify it still receives submissions)
- Hosting: Vercel (moving off GitHub Pages because the copilot needs a server function)

Do not add Monaco, a full component kit, or animation libraries unless `plan.md` calls for them. Keep the initial JS bundle under 250 KB gzipped.

## Directory layout (target)

```
api/
  copilot.ts              # serverless chat endpoint
docs/
  logo/                   # logo options, written by scripts/build-favicon.mjs
public/
  resume.pdf              # TODO(jasmeet) if not present. No profile photo.
src/
  content/                # SINGLE SOURCE OF TRUTH for all facts
    profile.ts
    projects.ts           # one object per project
    experience.ts         # one object per role
    skills.ts
    links.ts
    education.ts
  workspace/              # the VS Code shell
    TitleBar.tsx MenuBar.tsx ActivityBar.tsx Sidebar/ Tabs.tsx
    Breadcrumbs.tsx Editor.tsx Panel/ StatusBar.tsx CommandPalette.tsx
  files/                  # one renderer per "file" the visitor can open
  copilot/
  terminal/
  themes/                 # theme token files
  store/
  lib/
scripts/
  build-copilot-context.ts  # turns src/content into the copilot's grounding doc
```

Adding a new project or job must only require adding one object to `src/content/projects.ts` or `src/content/experience.ts`. The explorer, routes, command palette, terminal `ls`, sitemap, and copilot context all derive from those arrays. If you find yourself editing more than one file to add a project, the architecture is wrong; fix it.

## Commands

```
npm run dev        # local dev
npm run build      # typecheck + build (also runs build-copilot-context)
npm run lint
npm run preview
```

Run `npm run build` and `npm run lint` before every commit. Both must pass.

## Git workflow

- Work on branch `revamp/vscode`. Never force push `main`.
- Commit at the end of each phase with a message like `phase 2: workspace shell`.
- Before Phase 1 deletion, the old site must be tagged `legacy-v1` and pushed so it is recoverable forever. (Done, along with `redesign-v1`.)

## Quality floor (every phase)

- Keyboard: every action reachable by keyboard, visible focus rings, shortcuts listed in Help match reality.
- `prefers-reduced-motion` respected.
- Mobile works (see plan, Phase 6). Check at 375px wide.
- Color contrast AA in every theme, including the light theme.
- No console errors or warnings in dev.

## When unsure

Ask Jasmeet one focused question rather than guessing, especially about content, naming, or anything irreversible.
