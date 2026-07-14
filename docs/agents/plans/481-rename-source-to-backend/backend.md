# Backend Plan: Rename source to backend

Main plan: [plan.md](plan.md)

## Shared contracts

- After this change, `backend/` replaces `source/` as the top-level folder, with identical
  internal structure (`pyproject.toml`, `poetry.lock`, `manage.py`, `majora_project/`,
  `games/`, `conftest.py`, etc.). `infra` depends on this new path for Docker/CI config.

## Implementation Steps

### Step 1 — Rename the folder

Run `git mv source backend` from the repo root to preserve file history.

### Step 2 — Fix the internal `source/...` path reference in `backend/pyproject.toml`

`[tool.bandit].exclude_dirs` currently reads:

```toml
exclude_dirs = ["games/tests", "source/games/tests", "versioning/tests", "source/versioning/tests"]
```

The `games/tests`/`versioning/tests` entries are relative to the project folder itself and
stay as-is. The `source/games/tests`/`source/versioning/tests` entries are repo-root-relative
duplicates (covering the case bandit is invoked from the repo root) — rename these two to
`backend/games/tests` and `backend/versioning/tests`:

```toml
exclude_dirs = ["games/tests", "backend/games/tests", "versioning/tests", "backend/versioning/tests"]
```

No other `source` reference inside the project (e.g. `[tool.coverage.run].source =
["games", "versioning"]`) refers to the folder path — that `source` key is coverage's own
config keyword for "source packages to measure" and must NOT be changed.

### Step 3 — Sanity-check nothing inside the folder hardcodes the old path

Grep `backend/` for any remaining literal `source/` or `"source"` path references (e.g. in
`conftest.py`, Django settings, or migrations) beyond the `pyproject.toml` entries already
handled. None are expected, but confirm.

## Files to Change

- `source/` → `backend/` — renamed via `git mv` (entire tree, history preserved).
- `backend/pyproject.toml` — `[tool.bandit].exclude_dirs` path fix (Step 2).

## CI Checks

- `backend`: `cd backend && poetry run pytest --cov` and `poetry run ruff check .`
  (CI job: backend test/lint jobs in `.circleci/config.yml` — note `infra` is updating the
  `working_directory` for these jobs from `~/project/source` to `~/project/backend` in the
  same change set)

## Notes

- Run tests via `docker-compose run --rm majora_tests pytest` as usual — the compose volume
  mount itself is `infra`'s responsibility to repoint at `./backend`, but this agent's own
  `git mv` must land before that mount will resolve correctly.
