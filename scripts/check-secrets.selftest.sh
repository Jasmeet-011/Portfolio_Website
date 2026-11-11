#!/usr/bin/env bash
# Proves scripts/check-secrets.sh catches what it must and passes what it should, in a
# temporary directory. The gate runs this before the real check. Dummy keys are built at
# run time from random characters, so no key-shaped string sits in the repo for secret
# scanners to flag.
set -uo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

rnd() { LC_ALL=C tr -dc 'A-Za-z0-9_-' < /dev/urandom 2>/dev/null | head -c "$1"; }
case_dir() { mkdir -p "$tmp/$1/dist" "$tmp/$1/env"; echo 'console.log("hi")' > "$tmp/$1/dist/index.js"; }

fails=0
expect() { # expect <wanted exit> <case> <label>
  local rc=0
  bash scripts/check-secrets.sh "$tmp/$2/dist" "$tmp/$2/env" > "$tmp/$2.out" 2>&1 || rc=$?
  if [ "$rc" -eq "$1" ]; then echo "  ok   $3"; else
    echo "  FAIL $3 (exit $rc, wanted $1)"; sed 's/^/       /' "$tmp/$2.out"; fails=1
  fi
}

old="AI""za$(rnd 35)"            # Google's older key shape, 39 characters
new="AQ"".Ab$(rnd 48)"           # Google's newer auth key shape, 53 characters
[ "${#old}" -eq 39 ] && [ "${#new}" -eq 53 ] || { echo "dummy keys came out the wrong length"; exit 1; }
v1="$(rnd 53)"
v2="$(rnd 53)"
v3="$(rnd 40)"

case_dir clean
expect 0 clean "a clean build passes"

case_dir old
echo "const k=\"$old\";" >> "$tmp/old/dist/index.js"
expect 1 old "an AIza key (39 characters) in the build fails"

case_dir new
echo "const k=\"$new\";" >> "$tmp/new/dist/index.js"
expect 1 new "an AQ.Ab key (53 characters) in the build fails"

case_dir name
echo 'const n="GEMINI_API_KEY";' >> "$tmp/name/dist/index.js"
expect 1 name "a server setting's name in the build fails"

case_dir dotenv
printf '   GEMINI_API_KEY=%s\n' "$v1" > "$tmp/dotenv/env/.env"
echo "const k=\"$v1\";" >> "$tmp/dotenv/dist/index.js"
expect 1 dotenv "a value from .env (indented, unquoted) in the build fails"

case_dir local
printf 'export GEMINI_EVAL_API_KEY="%s"\r\n' "$v2" > "$tmp/local/env/.env.local"
echo "const k=\"$v2\";" >> "$tmp/local/dist/index.js"
expect 1 local "a value from .env.local (export, quoted, CRLF) in the build fails"

case_dir comment
printf 'ANTHROPIC_API_KEY=%s # a comment\n' "$v3" > "$tmp/comment/env/.env.local"
echo "const k=\"$v3\";" >> "$tmp/comment/dist/index.js"
expect 1 comment "a value with a trailing comment in the build fails"

case_dir unused
printf '   GEMINI_API_KEY=%s\n' "$v1" > "$tmp/unused/env/.env"
printf 'GEMINI_EVAL_API_KEY="%s"\r\n' "$v2" > "$tmp/unused/env/.env.local"
expect 0 unused "values in .env and .env.local that aren't in the build pass"

case_dir missing
rm -rf "$tmp/missing/dist"
expect 2 missing "a missing build directory is an error, not a pass"

exit "$fails"
