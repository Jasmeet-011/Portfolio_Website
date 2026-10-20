import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// Unit tests live next to the code as *.test.ts. tests/e2e is Playwright's.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: { include: ["src/**/*.test.ts", "api/**/*.test.ts"] },
  }),
);
