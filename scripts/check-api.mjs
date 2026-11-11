// The assistant API built and called the way Vercel runs it, not through Vite's dev plugin.
//
// 1. Type-checks and compiles api/ with api/tsconfig.json, the config Vercel's Node builder
//    picks up, into node_modules/.cache/api-build (no emit on any type error).
// 2. Imports the compiled api/copilot.js in plain Node as an ES module, the way the
//    function runs, with no API key, no Upstash and VERCEL=1, like an unconfigured deploy.
// 3. Dispatches requests the way Vercel does: the export named after the HTTP method
//    handles it, and a method with no export gets 405 without reaching the code.
//
// It checks GET (the page's availability check) and POST, and that the failure logs are
// structured and never carry the question. No request reaches a provider.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "node_modules", ".cache", "api-build");
rmSync(out, { recursive: true, force: true });

const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
try {
  execFileSync(process.execPath, [tsc, "-p", join(root, "api", "tsconfig.json"), "--outDir", out], {
    stdio: "inherit",
  });
} catch {
  console.error("api/ doesn't compile with api/tsconfig.json, the config Vercel uses");
  process.exit(1);
}
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "package.json"), '{ "type": "module" }\n');

// An unconfigured deploy. Nothing from .env is loaded: plain Node doesn't read it.
for (const name of Object.keys(process.env))
  if (/API_KEY|UPSTASH|KV_REST|IP_HASH_SALT|^ASSISTANT_/.test(name)) delete process.env[name];
process.env.VERCEL = "1";

const logs = [];
for (const level of ["warn", "error"]) {
  console[level] = (...args) => logs.push({ level, line: args.join(" ") });
}

const fn = await import(pathToFileURL(join(out, "copilot.js")).href);
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
const exported = METHODS.filter((m) => typeof fn[m] === "function");

/** Vercel's routing for web-standard handlers: no export for the method means 405. */
async function call(method, body) {
  const handler = fn[method];
  if (typeof handler !== "function") return { status: 405, body: null };
  const response = await handler(
    new Request("https://example.vercel.app/api/copilot", {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body,
    }),
  );
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // not JSON
  }
  return { status: response.status, body: json };
}

const QUESTION = "What did Jasmeet build in AgentGuard? marker-7f3a";
const failures = [];
const check = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

const get = await call("GET");
check(
  exported.includes("GET"),
  "api/copilot.ts exports GET, so Vercel routes the availability check to it",
);
check(get.status === 200, `GET answers 200 (got ${get.status})`);
check(
  get.body?.available === false && typeof get.body?.message === "string",
  "GET says the assistant is unavailable when it isn't configured",
);

const ask = await call("POST", JSON.stringify({ question: QUESTION }));
check(
  ask.status === 503 && ask.body?.code === "unavailable",
  `POST without a key answers 503 unavailable (got ${ask.status})`,
);

const bad = await call("POST", "{not json");
check(
  bad.status === 400 && bad.body?.code === "invalid",
  `POST with a bad body answers 400 (got ${bad.status})`,
);

const put = await call("PUT", "{}");
check(put.status === 405, `PUT answers 405 (got ${put.status})`);

const parsedLogs = logs.map((l) => {
  try {
    return { level: l.level, entry: JSON.parse(l.line) };
  } catch {
    return { level: l.level, entry: null, raw: l.line };
  }
});
check(
  parsedLogs.some((l) => l.entry?.event === "assistant_failure" && l.entry.stage === "config"),
  "the 503 is logged as a structured config failure",
);
check(
  parsedLogs.some((l) => l.entry?.event === "assistant_failure" && l.entry.stage === "validation"),
  "the 400 is logged as a structured validation failure",
);
check(
  logs.every((l) => !l.line.includes("marker-7f3a")),
  "no log line carries the question text",
);

rmSync(out, { recursive: true, force: true });
if (failures.length) {
  console.error(`${failures.length} API check(s) failed`);
  process.exit(1);
}
console.log("api checks passed");
