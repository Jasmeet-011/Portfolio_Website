import { depsFromEnv } from "./_lib/deps.js";
import { createHandler } from "./_lib/handler.js";

/**
 * POST /api/copilot: the assistant (plan.md 7.7). A Vercel function in the web-standard
 * Request/Response form; `npm run dev` serves the same export (vite.config.ts). The API
 * key and Upstash credentials are read here, on the server, and never reach the client.
 */
const handle = createHandler(depsFromEnv());

export function POST(request: Request): Promise<Response> {
  return handle(request);
}
