# Backend Plan: Frontend check script strips deliberate eslint-disable directives (lint_fix modifies files)

Main plan: [plan.md](plan.md)

## Shared contracts

`.claude/scripts/check_backend.sh` must only report problems: no file changes, non-zero exit on lint errors.

## Implementation Steps

### Step 1 — Make the backend check check-only
In `.claude/scripts/check_backend.sh`, replace `docker-compose run --rm majora_tests poetry run ruff check --fix .` with `docker-compose run --rm majora_tests poetry run ruff check .`. `ruff check` exits non-zero on violations, so lint errors still fail the script.

### Step 2 — Update the backend agent's development cycle
In `.claude/agents/backend.md`, change the "Development cycle" check step from `ruff check --fix .` to `ruff check .`. In the "Commands" list, add `ruff check .` as the lint check and keep `ruff check --fix .` as an optional auto-fix tool.

## Files to Change
- `.claude/scripts/check_backend.sh` — `ruff check --fix .` → `ruff check .`
- `.claude/agents/backend.md` — development cycle uses `ruff check .`

## CI Checks
- `backend/`: `docker-compose run --rm majora_tests poetry run pytest` and `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`)

## Notes
- Verify: after running `.claude/scripts/check_backend.sh`, `git status` is clean.
