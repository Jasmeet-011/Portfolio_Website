#!/usr/bin/env bash
# Every check a commit must pass, in order. Stops at the first failure.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== format";  npx prettier --check .
echo "== build";   npm run build          # theme contrast check, typecheck, vite build
# api/ type-checked and compiled with api/tsconfig.json, the config Vercel uses, then
# called in plain Node with Vercel's routing by method export (not the Vite dev plugin).
echo "== api (as Vercel builds it)"; node scripts/check-api.mjs
echo "== secrets"
# API keys and server settings must never reach the client bundle or git. Key shapes, names,
# and each secret's value from .env and .env.local: see scripts/check-secrets.sh. The
# self-test proves the check catches dummy keys in both Google formats first.
bash scripts/check-secrets.selftest.sh
bash scripts/check-secrets.sh
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
