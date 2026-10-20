#!/usr/bin/env bash
# Every check a commit must pass, in order. Stops at the first failure.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== format";  npx prettier --check .
echo "== build";   npm run build          # theme contrast check, typecheck, vite build
echo "== secrets"
# API keys and server settings must never reach the client bundle or git. Key shapes:
# Anthropic sk-ant-..., Google AIza plus 35 characters. Names cover the site's and the
# eval's keys. Each key's value from .env.local is checked too, without printing it.
# grep exits 1 for no match; above 1 is an error, which fails the gate, never passes it.
search() {
  local rc=0
  grep -rl "$@" dist || rc=$?
  if [ "$rc" -gt 1 ]; then echo "secret search failed ($rc)"; exit 1; fi
  return "$rc"
}
if search -E "sk-ant-|AIza[0-9A-Za-z_-]{35}|ANTHROPIC_API_KEY|GEMINI_API_KEY|GEMINI_EVAL_API_KEY|UPSTASH_REDIS|IP_HASH_SALT|KV_REST_API"; then
  echo "server secret or setting name found in dist/"; exit 1
fi
for name in ANTHROPIC_API_KEY GEMINI_API_KEY GEMINI_EVAL_API_KEY; do
  key="$(grep -s "^$name=" .env.local | cut -d= -f2- | tr -d '\r"'"'" || true)"
  if [ -n "$key" ] && search -F -- "$key"; then echo "$name value found in dist/"; exit 1; fi
done
if git ls-files | grep -E '(^|/)\.env' | grep -v '\.env\.example$'; then
  echo ".env file tracked by git"; exit 1
fi
echo "== banned names"
# Names that must never appear in the repo. Stored
# base64-encoded so this check doesn't put them in the repo itself. Searches tracked and
# untracked (not ignored) files. git grep exits 1 for no match; anything above 1 is an
# error, which fails the gate rather than passing it.
for encoded in YmFja3N0b3A=; do
  banned="$(printf '%s' "$encoded" | base64 -d)"
  rc=0
  git grep --untracked -I -i -l -F "$banned" -- . ':!package-lock.json' || rc=$?
  if [ "$rc" -eq 0 ]; then echo "a banned name is in the repo"; exit 1; fi
  if [ "$rc" -gt 1 ]; then echo "banned-name search failed ($rc)"; exit 1; fi
done
echo "== lint";    npx eslint . --max-warnings=0
echo "== unit";    npx vitest run
echo "== e2e";     npx playwright test --grep-invert screenshots --workers="${E2E_WORKERS:-4}"
echo "== gate passed"
