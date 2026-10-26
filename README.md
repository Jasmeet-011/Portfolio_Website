# jasmeet-wadhwa

Jasmeet Singh Wadhwa's portfolio, built as a VS Code workspace in the browser. Pages are files you open in tabs from the explorer, the career reads as a git graph, the terminal takes commands, and an assistant answers questions from the site's own content and cites the file each answer came from.

GitHub: [Jasmeet-011](https://github.com/Jasmeet-011)

## Stack

- Vite, React 18 and TypeScript (strict)
- Tailwind CSS, with every color a theme variable
- Zustand for workspace state, React Router for a URL per file
- cmdk for the command palette, Shiki for Source views, lucide-react for icons
- The assistant: a Vercel serverless function (`api/copilot.ts`) on the Gemini API, with Claude as the alternative provider and rate limits on Upstash Redis
- Vitest for unit tests, Playwright for end-to-end tests

All content lives in `src/content/`. The explorer, routes, palette, terminal, search and assistant context are derived from it, so adding a project is one object in `src/content/projects.ts`.

## Run it locally

Needs Node 22.

```sh
npm ci
cp .env.example .env.local   # then fill in what you need
npm run dev
```

Only the assistant needs a key: set `GEMINI_API_KEY` in `.env.local`. Everything else runs without one. `.env.example` lists every variable and where it is needed. Never commit `.env.local`.

## Tests and evals

```sh
npm test                         # unit tests (Vitest)
npx playwright install chromium  # once, before the first e2e run
npm run test:e2e                 # end-to-end tests (Playwright)
npm run lint
npm run build                    # theme contrast check, assistant context, typecheck, build
npm run gate                     # everything a commit must pass
npm run eval:assistant           # assistant evals against the real API
```

The evals call the Gemini API, so they never run in the gate. They read `GEMINI_EVAL_API_KEY` from `.env.local`: use a key from a separate Google Cloud project so eval runs don't spend the site's quota.

## Plan

Scope, design and every decision so far: [plan.md](plan.md).
