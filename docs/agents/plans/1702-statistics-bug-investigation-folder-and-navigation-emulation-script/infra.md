# Infra Plan: Statistics bug: investigation folder and navigation emulation script

Main plan: [plan.md](plan.md)

## Shared contracts

- Exclude the glob `investigations/**` from markdownlint and Codacy. The folder's content is
  owned by the investigator; do not create or edit anything inside it.

## Implementation Steps

### Step 1 — Exclude `investigations/` from markdownlint and Codacy

- `.markdownlint-cli2.jsonc`: add `"investigations/**"` to `ignores`.
- `.codacy.yml`: add a top-level `exclude_paths` entry `"investigations/**"`, so every engine
  (duplication, pmd, bandit, …) skips it. Keep the existing per-engine excludes.
- Confirm, without changing anything, that the other CI jobs do not pick up the folder:
  - `checks` runs `ruff check .` after copying `backend/*` to the job root, so only backend
    files are linted;
  - pytest (`pytest_*` jobs) runs inside `backend/`;
  - Jasmine and ESLint run inside `frontend/`; client jobs inside `client/`.
  Record the result in the PR description.

### Step 2 — Document the exclusion

`docs/agents/investigator.md` already says investigation folders are excluded from CI. Add one
sentence naming where (markdownlint `ignores`, Codacy `exclude_paths`) so the next investigation
does not need to rediscover it.

## Files to Change

- `.markdownlint-cli2.jsonc` — ignore `investigations/**`.
- `.codacy.yml` — global `exclude_paths` for `investigations/**`.
- `docs/agents/investigator.md` — name the two exclusion points.

## CI Checks

- markdownlint: `docker-compose run --rm majora_markdownlint` (or `make` equivalent) (CI job:
  `markdownlint`).

## Notes

- The markdownlint ignore must not hide any other `.md` file; check the glob only matches the
  root `investigations/` folder.
