import { anthropicProvider } from "./anthropic.js";

export type { Provider, ProviderConfig, ProviderEvent, ProviderRequest } from "./types.js";

/**
 * The provider the assistant uses. To route through LLM Gateway, write a gatewayProvider
 * that implements Provider (./types.ts) and change this one line.
 */
export const createProvider = anthropicProvider;
