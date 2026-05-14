#!/bin/bash
# SessionStart hook: installs npm dependencies so tests, type-checking, and the
# dev server are ready before the agent loop begins. Runs synchronously so the
# session never starts before node_modules is in place.
set -euo pipefail

# Only run in Claude Code on the web; local environments manage their own deps.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# npm install (not npm ci) so the cached container layer is reused across
# sessions; it is idempotent and a no-op when node_modules is already current.
npm install --no-audit --no-fund
