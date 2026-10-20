import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

/** Vercel provides the deployed commit; local builds ask git. */
function commit(): string {
  const fromVercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromVercel) return fromVercel.slice(0, 7);
  try {
    return execSync("git rev-parse --short=7 HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

/**
 * Serves api/copilot.ts at /api/copilot during `npm run dev`, the way Vercel does in
 * production, so the assistant runs locally without the Vercel CLI. Server-only
 * variables from .env.local (ANTHROPIC_API_KEY and friends) go into this Node process
 * only: Vite exposes just VITE_-prefixed variables to the browser, and the app uses none.
 */
function assistantDevApi(): Plugin {
  return {
    name: "assistant-dev-api",
    apply: "serve",
    configureServer(server) {
      for (const [key, value] of Object.entries(loadEnv(server.config.mode, process.cwd(), "")))
        process.env[key] ??= value;
      server.middlewares.use("/api/copilot", async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers))
          if (typeof value === "string") headers.set(key, value);
        const request = new Request(`http://localhost${req.originalUrl ?? "/api/copilot"}`, {
          method: req.method,
          headers,
          body: req.method === "POST" ? Buffer.concat(chunks) : undefined,
        });
        const { POST } = (await server.ssrLoadModule("/api/copilot.ts")) as {
          POST: (request: Request) => Promise<Response>;
        };
        const response = await POST(request);
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        if (response.body) for await (const chunk of response.body) res.write(chunk);
        res.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), assistantDevApi()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // Shown in Settings and Help > About.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT__: JSON.stringify(commit()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
});
