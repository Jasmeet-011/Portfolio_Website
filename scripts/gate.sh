#!/usr/bin/env bash
# Every check a commit must pass, in order. Stops at the first failure.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== format";  npx prettier --check .
echo "== build";   npm run build          # theme contrast check, typecheck, vite build
echo "== lint";    npx eslint . --max-warnings=0
echo "== unit";    npx vitest run
echo "== e2e";     npx playwright test --grep-invert screenshots --workers="${E2E_WORKERS:-4}"
echo "== gate passed"
