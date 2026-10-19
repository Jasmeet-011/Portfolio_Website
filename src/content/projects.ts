import { todo, type Todo } from "./todo";

/**
 * One object per project. Explorer, routes, palette, terminal, search, sitemap,
 * Plain view and assistant context all derive from this array.
 *
 * Facts come from plan.md section 10. Wording was read from each repo.
 */
export type ProjectLanguage =
  "Python" | "TypeScript" | "JavaScript" | "Go" | "Solidity" | (string & {});

export type ProjectStatus = "shipped" | "building";

export interface ProjectLinks {
  github?: string;
  /** A deployed, working app. */
  live?: string;
  /** A recorded or scripted demo. */
  demo?: string;
  paper?: string;
}

interface ProjectBase {
  slug: string;
  name: string;
  /** Extension follows the repo's main language on GitHub. */
  fileName: string;
  language: ProjectLanguage;
  status: ProjectStatus;
  period: string | Todo;
  /** Under 20 words. Numbers belong in built or results. */
  oneLiner: string;
  problem: string | Todo;
  /** What Jasmeet actually built, in first person. */
  built: string[] | Todo;
  /** Only real, verifiable outcomes. Leave out when nothing is measured. */
  results?: string[] | Todo;
  /** Feeds the Extensions view. Only what the built code uses. */
  stack: string[];
  links: ProjectLinks;
  context?: string | Todo;
}

/**
 * Where a project shows up. Featured projects appear on the Welcome tab: shipped ones
 * as featured work, building ones in the "Currently building" slot as a feature branch.
 * Archived projects live in projects/archive/, stay in search and Plain view, and are
 * left out of the Welcome tab and the assistant's suggested questions.
 * A project can't be both featured and archived.
 */
type ProjectPlacement =
  { featured: boolean; archived: false } | { featured: false; archived: true };

export type Project = ProjectBase & ProjectPlacement;

const noPeriod = () => todo("TODO(jasmeet): project dates, no source gives them");

export const projects: Project[] = [
  {
    slug: "agentguard",
    name: "AgentGuard",
    fileName: "agentguard.py",
    language: "Python",
    status: "shipped",
    featured: true,
    archived: false,
    period: noPeriod(),
    oneLiner:
      "A research assistant for financial advisors that answers from SEC filings with a cited source for every sentence.",
    problem:
      "Advisors and compliance teams read hundreds of pages of Form ADV filings to answer questions about fees, conflicts and disciplinary history. In a regulated business, an LLM that invents a fee number is worse than no answer at all.",
    built: [
      "I indexed 10 SEC Form ADV brochures (746 chunks) for hybrid dense and BM25 retrieval with reranking.",
      "I made it cite a source chunk for every sentence, refuse when the brochures don't hold the answer, and block requests for personalized advice.",
      "I built a baseline, measured it, then added one component at a time and reported what moved the numbers, including the components that didn't.",
      "I made every component a config flag, so the eval harness can run ablations and the Streamlit UI can switch them live.",
      "I cached LLM calls on disk, so evals and demos re-run cheaply and identically.",
    ],
    // The caveat always travels with the numbers (plan.md section 10).
    results: [
      "Held-out test split, run once per variant with no tuning afterwards: 8 questions (4 answerable, 3 unanswerable, 1 policy).",
      "On this data the guardrails buy safety and traceability, not accuracy: identical answers for +57% latency and +17% cost.",
      "With 4 answerable questions, one miss moves correctness by 25 points, so read this as an anecdote, not a benchmark.",
    ],
    stack: ["Claude", "RAG", "Qdrant", "BM25", "Evals", "Python", "Streamlit"],
    links: { github: "https://github.com/Jasmeet-011/AgentGuard" },
  },
  {
    slug: "chainlens",
    name: "ChainLens",
    fileName: "chainlens.py",
    language: "Python",
    status: "shipped",
    featured: true,
    archived: false,
    period: noPeriod(),
    oneLiner:
      "One portfolio view across Aptos and Solana wallets, with price alerts and a Gemini chat about your holdings.",
    problem:
      "Holding tokens on Aptos and Solana means checking separate wallets and explorers with no combined view of your exposure.",
    built: [
      "I put each chain behind one adapter interface, so adding a chain doesn't touch portfolio, insights or alerts.",
      "I added CoinGecko pricing, history snapshots, concentration and chain-exposure insights, and scheduled email price alerts.",
      "I compute concentration, chain exposure and stablecoin share in code. The LLM explains the numbers; it doesn't produce them.",
      "I narrowed the chat context: the service pulls the token the user asked about out of the question and sends Gemini only the wallets holding it.",
      "I built the backend in FastAPI with JWT auth and deployed the frontend on Vercel.",
    ],
    results: todo("TODO(jasmeet): a measured result (wallets tracked, response times, users)"),
    stack: ["FastAPI", "MongoDB", "Gemini", "Solana", "Aptos", "Python"],
    links: {
      github: "https://github.com/Jasmeet-011/On-Chain-Portfolio",
      live: "https://on-chain-portfolio.vercel.app",
    },
    context: todo("TODO(jasmeet): event or context, if any"),
  },
  {
    slug: "silentsos",
    name: "SilentSOS",
    fileName: "silentsos.ts",
    language: "TypeScript",
    status: "shipped",
    featured: true,
    archived: false,
    period: noPeriod(),
    oneLiner:
      "Emergency app for people who can't speak or type. A Gemini Live agent asks yes/no questions, then alerts contacts.",
    problem:
      "People with ALS, autism, hearing impairments, or any condition that stops them speaking or typing can't make a normal emergency call. SilentSOS needs one tap: the agent works out what's wrong through the camera and yes/no questions, then alerts emergency contacts.",
    built: [
      "I built a four-level fallback chain (Gemini Live, Gemini one-shot, Claude Vision, static questions), so help is dispatched even if every AI service fails.",
      "I made onAnswer() return a promise resolved by a tap or a nod, so the agent loop stays linear while the UI drives the input.",
      "I read head nods from the phone's accelerometer, so answering needs no camera-based model and works on any phone.",
      "I use Claude to turn the dialogue into the structured summary that goes out by SMS, with GPS location.",
    ],
    results: todo("TODO(jasmeet): measured tap-to-SMS time. No timing claims until measured"),
    stack: ["Gemini Live", "Claude", "React Native", "Expo", "Twilio", "Supabase"],
    links: { github: "https://github.com/Jasmeet-011/Silentsos" },
    context: "Built for the Gemini Live API hackathon, Live Agent track.",
  },
  {
    slug: "llm-gateway",
    name: "LLM Gateway",
    fileName: "llm_gateway.py",
    language: "Python",
    status: "building",
    featured: true,
    archived: false,
    period: noPeriod(),
    oneLiner:
      "A gateway designed to put auth, rate limits, retries, fallback and cost accounting in front of Claude and Gemini.",
    problem:
      "Every service that calls an LLM provider ends up re-implementing the same reliability work: timeouts, retries, fallback when a provider degrades, rate limits, and knowing what each API key spends. LLM Gateway puts that in one place. Clients call one unified API, and the gateway handles provider differences, failures and accounting.",
    built: [
      "I built the unified request and response schema, provider error types, adapter interface and mock provider, with tests.",
      "I made requests canonical: message lists are tuples and an empty stop list is normalized to None, so equal requests produce one cache key.",
      "I reject a trailing assistant message in the schema: newer Claude models return a 400 for a prefilled assistant turn, so the error comes before a billed round trip.",
    ],
    // TODO(jasmeet): no performance numbers until a measured k6 run.
    results: [
      "Verified so far: the unified schema with 45 passing tests, and clean ruff and strict mypy runs.",
    ],
    // Only what exists so far. TODO(jasmeet): add FastAPI, Redis, Postgres, Claude and
    // Gemini as each one lands in the repo.
    stack: ["Python"],
    links: { github: "https://github.com/Jasmeet-011/LLMGateway" },
  },
  {
    slug: "synapsemeet",
    name: "SynapseMeet",
    fileName: "synapsemeet.py",
    language: "Python",
    status: "building",
    featured: false,
    archived: false,
    period: noPeriod(),
    oneLiner:
      "A meeting pipeline that extracts summaries and action items with structured LLM output and links topics across meetings.",
    problem:
      'Decisions and action items from meetings end up scattered in notes nobody rereads. SynapseMeet turns each meeting into a summary, a list of action items with owners, and searchable text, and it connects people and topics across meetings, so "what did we decide about X last month?" has an answer.',
    built: [
      "I built the backend services and the AI pipeline as a working skeleton.",
      "I run post-meeting work in a Celery task, not the request path, with up to 3 retries and a 60-second backoff.",
      "I use function calling for action items and JSON mode for topics and sentiment, so results load into the database instead of being scraped from prose.",
      "I write people, topics and meetings with MERGE, so reprocessing a meeting doesn't duplicate nodes.",
    ],
    results: todo(
      "TODO(jasmeet): results (latency per stage, extraction accuracy on sample meetings)",
    ),
    stack: ["FastAPI", "Celery", "Neo4j", "Pinecone", "Whisper", "Next.js"],
    links: { github: "https://github.com/Jasmeet-011/SynapseMeet" },
  },
  {
    slug: "reposcope",
    name: "RepoScope",
    fileName: "reposcope.js",
    language: "JavaScript",
    status: "shipped",
    featured: false,
    archived: true,
    period: noPeriod(),
    oneLiner:
      "Pulls a repository's stars, forks, open issues and languages from the GitHub API, and asks Gemini for code suggestions.",
    problem: todo("TODO(jasmeet): the problem RepoScope solves"),
    built: todo("TODO(jasmeet): what you built, beyond the one-liner"),
    stack: ["React", "Express", "MongoDB", "GitHub API", "Gemini"],
    links: {
      github: "https://github.com/Jasmeet-011/RepoScope",
      live: "https://repo-scope.vercel.app",
    },
  },
  {
    slug: "codemate",
    name: "CodeMate",
    fileName: "codemate.js",
    language: "JavaScript",
    status: "shipped",
    featured: false,
    archived: true,
    period: noPeriod(),
    oneLiner:
      "Ask a coding question, pick a target language, and get a Gemini answer with syntax-highlighted code.",
    problem: todo("TODO(jasmeet): the problem CodeMate solves"),
    built: [
      "I built an Express API with per-IP rate limiting that saves every question and answer to MongoDB for a history view.",
    ],
    stack: ["React", "Express", "MongoDB", "Gemini"],
    // TODO(jasmeet): Jasmeet-011/codemate-chat (a later TypeScript chat UI) is not linked. Link it too?
    links: {
      github: "https://github.com/Jasmeet-011/Codemate",
      live: "https://codemate-taupe.vercel.app",
    },
  },
];
