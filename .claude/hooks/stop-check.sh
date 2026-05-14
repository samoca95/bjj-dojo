#!/bin/bash
# Stop hook: runs the type-checker and linter when Claude finishes a turn so
# regressions are caught and fixed in-session instead of in CI. Exits 2 to feed
# any failures back to Claude; passes silently when the code is clean.
set -uo pipefail

input=$(cat)

# Prevent infinite loops — if this hook already triggered a continuation, let
# the session stop regardless.
case "$input" in
  *'"stop_hook_active":true'* | *'"stop_hook_active": true'*) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Nothing to check until dependencies are installed (e.g. before SessionStart).
[ -d node_modules ] || exit 0

failed=0
report=""

if ! tsc_out=$(npx tsc -b 2>&1); then
  failed=1
  report="${report}TypeScript type-check failed:
${tsc_out}

"
fi

# eslint exits non-zero only on errors, not warnings.
if ! eslint_out=$(npx eslint . 2>&1); then
  failed=1
  report="${report}ESLint reported errors:
${eslint_out}

"
fi

if [ "$failed" -eq 1 ]; then
  {
    echo "Code quality checks failed — fix these before finishing:"
    echo
    printf '%s' "$report"
  } >&2
  exit 2
fi

exit 0
