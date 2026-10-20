#!/usr/bin/env bash
# Commits everything only if the full gate passes. Usage: scripts/commit.sh <message-file>
# Never pushes.
set -euo pipefail
cd "$(dirname "$0")/.."
message="${1:?usage: scripts/commit.sh <message-file>}"
test -s "$message"

# The commit message must not carry a banned name either (see gate.sh). Plain bash
# matching, lowercased: this machine's grep aborts on -i -F, which would read as "no match".
banned="$(printf '%s' YmFja3N0b3A= | base64 -d)"
text="$(cat "$message")"
if [[ "${text,,}" == *"${banned,,}"* ]]; then
  echo "the commit message contains a banned name"; exit 1
fi

bash scripts/gate.sh
git add -A
git commit -F "$message"
git log --oneline -1
