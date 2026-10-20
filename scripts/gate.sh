#!/usr/bin/env bash
# Every check a commit must pass, in order. Stops at the first failure.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== format";  npx prettier --check .
echo "== build";   npm run build          # theme contrast check, typecheck, vite build
echo "== secrets"
# The API key and server settings must never reach the client bundle or git.
if grep -rlE "sk-ant-|ANTHROPIC_API_KEY|UPSTASH_REDIS|IP_HASH_SALT|KV_REST_API" dist; then
  echo "server secret or setting name found in dist/"; exit 1
fi
key="$(grep -s '^ANTHROPIC_API_KEY=' .env.local | cut -d= -f2- || true)"
if [ -n "$key" ] && grep -rlF "$key" dist; then echo "API key value found in dist/"; exit 1; fi
if git ls-files | grep -E '(^|/)\.env' | grep -v '\.env\.example$'; then
  echo ".env file tracked by git"; exit 1
fi
echo "== lint";    npx eslint . --max-warnings=0
echo "== unit";    npx vitest run
echo "== e2e";     npx playwright test --grep-invert screenshots --workers="${E2E_WORKERS:-4}"
echo "== gate passed"
