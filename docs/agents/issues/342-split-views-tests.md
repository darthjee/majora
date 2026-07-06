# Split views tests

## Context

The `pytest_views` CircleCI job runs the full `games/tests/views/` suite (~529 tests) as a
single job, and it has become the slowest job in the pipeline. Splitting it into two
parallel jobs will reduce wall-clock time in CI.

## What needs to be done

Split `games/tests/views/` by the `characters/` directory, which holds all
`/games/:game_slug/pcs...` and `/games/:game_slug/npcs...` endpoint tests (251 tests),
versus everything else (278 tests: `games/`, `game_masters/`, `game_sessions/`, `staff/`,
`treasures/`, and the root-level view test files). This gives close to an even 47/53 split
and mirrors the `--ignore` pattern already used by `pytest_all`.

Infra: replace the `pytest_views` CircleCI job with two new jobs:
- `pytest_views_characters`: `poetry run pytest games/tests/views/characters/ --cov ...`
- `pytest_views_rest`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov ...`

Both jobs need to be added to the `requires` lists currently referencing `pytest_views`.

Options considered and rejected:
- **Split by "game" vs "non-game" views** (one job for everything under `games/`,
  `characters/`, `game_masters/`, `game_sessions/`; one job for `staff/`, `treasures/`,
  root files): maps cleanly to existing folders but produces a lopsided ~73/27 split,
  since `characters/` alone is 251 of the ~384 tests in the "game" bucket.
- **Split by "nested inside a game" vs "flat top-level" views** (e.g.
  `/games/:slug/pcs.json` vs `/games.json`, `/games/:slug.json`, `/treasures.json`):
  slightly better balance (~65/35) but requires cherry-picking individual test files out
  of the `games/tests/views/games/` directory, since that folder currently mixes both
  buckets — losing the clean directory-based CI command and adding maintenance burden for
  future tests.

## Acceptance criteria

- [ ] `pytest_views` CircleCI job is replaced by `pytest_views_characters` (running
  `games/tests/views/characters/`) and `pytest_views_rest` (running
  `games/tests/views/` with `--ignore=games/tests/views/characters/`)
- [ ] Both new jobs use the same `--cov` configuration as the previous `pytest_views` job
- [ ] Every `requires` list that referenced `pytest_views` is updated to require both new
  jobs
- [ ] CI passes with the new job split
