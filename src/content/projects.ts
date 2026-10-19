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

export interface Project {
  slug: string;
  name: string;
  /** Extension follows the repo's main language on GitHub. */
  fileName: string;
  language: ProjectLanguage;
  status: ProjectStatus;
  /** Shown on the Welcome tab. */
  featured: boolean | Todo;
  period: string | Todo;
  oneLiner: string;
  problem: string | Todo;
  /** What Jasmeet actually built. */
  built: string[] | Todo;
  /** Only real, verifiable outcomes. Leave out when nothing is measured. */
  results?: string[] | Todo;
  /** Feeds the Extensions view. Only what the built code uses. */
  stack: string[];
  links: ProjectLinks;
  context?: string | Todo;
}

const pickFeatured = () => todo("TODO(jasmeet): pick three projects for the Welcome tab");
const noPeriod = () => todo("TODO(jasmeet): project dates, no source gives them");

export const projects: Project[] = [
  {
    slug: "agentguard",
    name: "AgentGuard",
    fileName: "agentguard.py",
    language: "Python",
    status: "shipped",
    featured: pickFeatured(),
    period: noPeriod(),
    oneLiner:
      "A research assistant for financial advisors over 10 SEC Form ADV brochures (746 chunks), with hybrid dense and BM25 retrieval, reranking, and an eval harness that measures what each component adds.",
    problem:
      "Advisors and compliance teams read hundreds of pages of Form ADV filings to answer questions about fees, conflicts and disciplinary history. In a regulated business, an LLM that invents a fee number is worse than no answer at all.",
    built: [
      "Cites a source chunk for every sentence, refuses when the brochures don't hold the answer, and blocks requests for personalized advice.",
      "The project builds a baseline, measures it, adds one component at a time, and reports what moved the numbers, including the components that didn't.",
      "Every component is a config flag, so the eval harness can run ablations and the Streamlit UI can switch them live.",
      "LLM calls are cached on disk, so evals and demos re-run cheaply and identically.",
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
    featured: pickFeatured(),
    period: noPeriod(),
    oneLiner:
      "One portfolio across Aptos and Solana wallets, with CoinGecko pricing, history snapshots, concentration and chain-exposure insights, scheduled email price alerts, and a Gemini chat that answers questions about your holdings.",
    problem:
      "Holding tokens on Aptos and Solana means checking separate wallets and explorers with no combined view of your exposure.",
    built: [
      "Adding a chain means implementing one adapter interface; portfolio, insights and alerts stay unchanged.",
      "Concentration, chain exposure and stablecoin share are computed deterministically. The LLM explains numbers; it doesn't produce them.",
      "The chat service pulls the token the user asked about out of the question and sends Gemini only the wallets holding it, not the whole portfolio.",
      "The backend is FastAPI with JWT auth. The frontend is deployed on Vercel.",
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
    featured: pickFeatured(),
    period: noPeriod(),
    oneLiner:
      "An emergency app for people who can't speak or type. A Gemini Live agent watches through the camera and asks yes/no questions, answered with a nod or a tap, then texts emergency contacts a structured summary with GPS location.",
    problem:
      "People with ALS, autism, hearing impairments, or any condition that stops them speaking or typing can't make a normal emergency call. SilentSOS needs one tap: the agent works out what's wrong through the camera and yes/no questions, then alerts emergency contacts.",
    built: [
      "A four-level fallback chain (Gemini Live, Gemini one-shot, Claude Vision, static questions) dispatches help even if every AI service fails.",
      "onAnswer() returns a promise resolved by a tap or a nod, so the agent loop stays linear while the UI drives the input.",
      "Nod detection reads the phone's accelerometer, so answering needs no camera-based model and works on any phone.",
      "Claude turns the dialogue into the structured message that goes out by SMS.",
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
    featured: pickFeatured(),
    period: noPeriod(),
    oneLiner:
      "A FastAPI gateway in front of Claude and Gemini, designed to put auth, rate limits, caching, retries, provider fallback and per-key cost accounting behind one API.",
    problem:
      "Every service that calls an LLM provider ends up re-implementing the same reliability work: timeouts, retries, fallback when a provider degrades, rate limits, and knowing what each API key spends. LLM Gateway puts that in one place. Clients call one unified API, and the gateway handles provider differences, failures and accounting.",
    built: [
      "The unified request and response schema, provider error types, adapter interface and mock provider are built and tested.",
      "Message lists are tuples, and an empty stop list is normalized to None, so equal requests have one canonical form and produce one cache key.",
      "Prefilling the assistant turn returns a 400 on newer Claude models, so the schema rejects it before a billed round trip instead of failing at the provider.",
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
    featured: pickFeatured(),
    period: noPeriod(),
    oneLiner:
      "A meeting-intelligence pipeline that transcribes meetings, extracts summaries, action items and topics with structured LLM output, and links people and topics across meetings in a knowledge graph.",
    problem:
      'Decisions and action items from meetings end up scattered in notes nobody rereads. SynapseMeet turns each meeting into a summary, a list of action items with owners, and searchable text, and it connects people and topics across meetings, so "what did we decide about X last month?" has an answer.',
    built: [
      "The backend services and the AI pipeline exist as a working skeleton.",
      "Post-meeting work runs in a Celery task, not the request path. The task retries up to 3 times with a 60-second backoff.",
      "Action items come from function calling, and topics and sentiment from JSON mode, so results load into the database instead of being scraped from prose.",
      "People, topics and meetings are written with MERGE, so reprocessing a meeting doesn't duplicate nodes.",
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
    featured: pickFeatured(),
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
    featured: pickFeatured(),
    period: noPeriod(),
    oneLiner:
      "Ask a coding question, pick a target language, and get a Gemini answer with syntax-highlighted code. An Express API with per-IP rate limiting saves every question and answer to MongoDB for a history view.",
    problem: todo("TODO(jasmeet): the problem CodeMate solves"),
    built: todo("TODO(jasmeet): what you built, beyond the one-liner"),
    stack: ["React", "Express", "MongoDB", "Gemini"],
    // TODO(jasmeet): Jasmeet-011/codemate-chat (a later TypeScript chat UI) is not linked. Link it too?
    links: {
      github: "https://github.com/Jasmeet-011/Codemate",
      live: "https://codemate-taupe.vercel.app",
    },
  },
];
