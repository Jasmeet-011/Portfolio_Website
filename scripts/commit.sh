#!/usr/bin/env bash
# Commits everything only if the full gate passes. Usage: scripts/commit.sh <message-file>
# Never pushes.
set -euo pipefail
cd "$(dirname "$0")/.."
message="${1:?usage: scripts/commit.sh <message-file>}"
test -s "$message"

# The commit message must not carry a banned name either (see gate.sh).
if grep -i -q -F "$(printf '%s' YmFja3N0b3A= | base64 -d)" "$message"; then
  echo "the commit message contains a banned name"; exit 1
fi

bash scripts/gate.sh
git add -A
git commit -F "$message"
git log --oneline -1
