import { loadEnv } from "vite";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// npm run eval:assistant. Calls the real Claude API, so it is never part of the gate.
// .env.local supplies ANTHROPIC_API_KEY to this process only.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ["evals/**/*.eval.ts"],
      env: loadEnv("eval", process.cwd(), ""),
      testTimeout: 20 * 60_000,
    },
  }),
);
