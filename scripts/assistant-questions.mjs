// npm run assistant:questions: exports the anonymous question log (last 30 days) from
// Upstash so real questions can become eval cases. Reads the Upstash credentials from
// .env.local. Writes, under evals/inbox/ (git-ignored):
//   questions-<date>.jsonl  every logged question, oldest first
//   cases-<date>.jsonl      the unique questions as eval-case stubs to sort and fill in,
//                           then move into evals/assistant.jsonl
import { mkdirSync, writeFileSync } from "node:fs";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local.");
  process.exit(1);
}
const redis = new Redis({ url, token });

// Same prefix as QUESTION_KEY_PREFIX in api/_lib/store.ts.
const keys = [];
let cursor = "0";
do {
  const [next, batch] = await redis.scan(cursor, { match: "assistant:q:*", count: 500 });
  keys.push(...batch);
  cursor = String(next);
} while (cursor !== "0");

const entries = [];
for (let i = 0; i < keys.length; i += 100) {
  const values = await redis.mget(...keys.slice(i, i + 100));
  entries.push(...values.filter(Boolean));
}
entries.sort((a, b) => a.at.localeCompare(b.at));

const date = new Date().toISOString().slice(0, 10);
mkdirSync("evals/inbox", { recursive: true });
writeFileSync(
  `evals/inbox/questions-${date}.jsonl`,
  entries.map((e) => JSON.stringify(e)).join("\n") + (entries.length ? "\n" : ""),
);
const unique = [
  ...new Map(entries.filter((e) => !e.chip).map((e) => [e.question.toLowerCase(), e])).values(),
];
writeFileSync(
  `evals/inbox/cases-${date}.jsonl`,
  unique
    .map((e, i) =>
      JSON.stringify({
        id: `real-${date}-${i + 1}`,
        category: e.declined ? "offtopic" : "fact",
        question: e.question,
        expect: e.declined ? "decline" : "answer",
      }),
    )
    .join("\n") + (unique.length ? "\n" : ""),
);

const declined = entries.filter((e) => e.declined).length;
const chips = entries.filter((e) => e.chip).length;
console.log(
  `${entries.length} questions (${chips} from suggestion chips, ${declined} declined), ${unique.length} unique typed questions.`,
);
console.log(`Wrote evals/inbox/questions-${date}.jsonl and evals/inbox/cases-${date}.jsonl`);
