#!/usr/bin/env bash
# Commits everything only if the full gate passes. Usage: scripts/commit.sh <message-file>
# Never pushes.
set -euo pipefail
cd "$(dirname "$0")/.."
message="${1:?usage: scripts/commit.sh <message-file>}"
test -s "$message"

bash scripts/gate.sh
git add -A
git commit -F "$message"
git log --oneline -1
