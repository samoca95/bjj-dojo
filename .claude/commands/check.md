---
description: Run the full local validation suite (lint, format, type-check, tests, build)
allowed-tools: Bash(npm run lint), Bash(npm run lint:fix), Bash(npm run format), Bash(npm run format:check), Bash(npm run typecheck), Bash(npm test), Bash(npm run build)
---

Run the project's full validation suite and fix anything that fails. Work
through the steps in order:

1. `npm run lint` — if there are errors, fix the underlying code (use
   `npm run lint:fix` only for mechanical fixes). Warnings are acceptable but
   call them out.
2. `npm run format:check` — if it reports unformatted files, run
   `npm run format`.
3. `npm test` — if tests fail, diagnose and fix the root cause, then re-run.
4. `npm run build` — this also runs the `tsc -b` type-check; fix any type
   errors and re-run.

Re-run a step after fixing it so the final state is green. When done, give a
short summary with a ✅/‼️ for each of the four steps.
