import { anthropicProvider } from "./anthropic.js";
import { geminiProvider } from "./gemini.js";
import type { Provider, ProviderConfig } from "./types.js";

export type { Provider, ProviderConfig, ProviderEvent, ProviderRequest } from "./types.js";
export { ProviderError } from "./types.js";

export interface ProviderSpec {
  create: (config: ProviderConfig) => Provider;
  /** The environment variable holding the API key. */
  keyEnv: string;
  defaultModel: string;
  thinkingModes: readonly string[];
  /** Set from the eval run's time-to-first-words comparison (evals/report.md). */
  defaultThinking: string;
  /** The two modes the eval compares. */
  evalModes: readonly [string, string];
  /**
   * The model's free-tier limits for the site's project, as read in AI Studio, or null
   * until known. Google changes them without notice, so the date read goes with them.
   */
  freeTier: { rpm: number; tpm: number; rpd: number; readOn: string } | null;
}

/**
 * The providers the assistant can use; ASSISTANT_PROVIDER picks one (default gemini).
 * To route through LLM Gateway, add a spec here whose `create` implements Provider.
 */
export const PROVIDERS = {
  gemini: {
    create: geminiProvider,
    keyEnv: "GEMINI_API_KEY",
    // Gemini 3.5 Flash-Lite, stable, checked against Google's models page on 2026-10-20.
    defaultModel: "gemini-3.5-flash-lite",
    thinkingModes: ["minimal", "low", "medium", "high"],
    defaultThinking: "minimal",
    evalModes: ["minimal", "low"],
    // Read in AI Studio for the site's project on 2026-10-25. 3.1 Flash-Lite's are the
    // same, so 3.5 stays (Decisions log). The site keeps 400 a day and 12 a minute.
    freeTier: { rpm: 15, tpm: 250_000, rpd: 500, readOn: "2026-10-25" },
  },
  anthropic: {
    create: anthropicProvider,
    keyEnv: "ANTHROPIC_API_KEY",
    // Claude Haiku 5.5, checked against Anthropic's models overview on 2026-10-20.
    defaultModel: "claude-haiku-5-5",
    thinkingModes: ["off", "adaptive"],
    defaultThinking: "off",
    evalModes: ["off", "adaptive"],
    freeTier: null,
  },
} satisfies Record<string, ProviderSpec>;

export type ProviderName = keyof typeof PROVIDERS;

export const DEFAULT_PROVIDER: ProviderName = "gemini";

/** The spec ASSISTANT_PROVIDER names, the default when unset, null when it names nothing. */
export function providerSpec(
  name: string | undefined,
): (ProviderSpec & { name: ProviderName }) | null {
  const key = (name || DEFAULT_PROVIDER) as ProviderName;
  return Object.hasOwn(PROVIDERS, key) ? { name: key, ...PROVIDERS[key] } : null;
}
