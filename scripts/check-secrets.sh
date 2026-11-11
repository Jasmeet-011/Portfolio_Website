#!/usr/bin/env bash
# Fails if a server secret, or a server setting's name, is in the built client files.
# Usage: scripts/check-secrets.sh [dist-dir] [env-dir]   (defaults: dist and the repo root)
#
# Key shapes: Anthropic sk-ant-..., Google's older keys (AIza plus 35 characters) and its
# newer auth keys (AQ.Ab plus at least 40 more; 53 characters in all as of 2026-11). Names
# cover the site's and the eval's settings. Each secret's value is also read from .env and
# .env.local, the two files Vite and the eval load, and searched for without printing it.
#
# Exit 0: clean. Exit 1: something found. Exit 2: the search itself failed, which must
# fail the gate, never pass it (grep exits 1 for no match and above 1 for an error).
set -uo pipefail
cd "$(dirname "$0")/.."
dist="${1:-dist}"
envdir="${2:-.}"
[ -d "$dist" ] || { echo "no $dist/ to check"; exit 2; }

search() {
  local rc=0
  grep -rl "$@" "$dist" || rc=$?
  if [ "$rc" -gt 1 ]; then echo "secret search failed ($rc)"; exit 2; fi
  return "$rc"
}

shapes='sk-ant-|AIza[0-9A-Za-z_-]{35}|AQ\.Ab[0-9A-Za-z_.-]{40,}'
names='ANTHROPIC_API_KEY|GEMINI_API_KEY|GEMINI_EVAL_API_KEY|UPSTASH_REDIS|IP_HASH_SALT|KV_REST_API'
if search -E "$shapes|$names"; then
  echo "server secret or setting name found in $dist/"; exit 1
fi

# Values, parsed the way dotenv does: optional leading space and "export", optional quotes,
# a trailing " # comment" on unquoted values, CRLF line ends. Values never reach stdout.
# Anything under 16 characters is a placeholder, not a key, and would only match noise.
found=0
for name in ANTHROPIC_API_KEY GEMINI_API_KEY GEMINI_EVAL_API_KEY \
  UPSTASH_REDIS_REST_TOKEN KV_REST_API_TOKEN IP_HASH_SALT; do
  for file in "$envdir/.env" "$envdir/.env.local"; do
    [ -f "$file" ] || continue
    while IFS= read -r line || [ -n "$line" ]; do
      [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?${name}[[:space:]]*=(.*)$ ]] || continue
      value="${BASH_REMATCH[2]//$'\r'/}"
      value="${value#"${value%%[![:space:]]*}"}"
      if [[ "$value" =~ ^\"(.*)\"$ || "$value" =~ ^\'(.*)\'$ ]]; then
        value="${BASH_REMATCH[1]}"
      else
        value="${value%%[[:space:]]#*}"
        value="${value%"${value##*[![:space:]]}"}"
      fi
      [ "${#value}" -ge 16 ] || continue
      if search -F -- "$value"; then
        echo "$name value from ${file##*/} found in $dist/"; found=1
      fi
    done < "$file"
  done
done
exit "$found"
