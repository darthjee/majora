# Infra Plan: Organize Python code

Main plan: [plan.md](plan.md)

## Shared contracts

Backend is moving `backend/games/tests/views/characters/*` into
`backend/games/tests/views/game/pcs/` and `backend/games/tests/views/game/npcs/` (see
[plan.md](plan.md)'s "Shared contracts" and [backend.md](backend.md) Step 2) — every
character/PC/NPC test ends up under `backend/games/tests/views/game/`. This is the only
thing infra's change depends on; do not merge this change ahead of that move landing, or
`pytest_views_characters` will collect zero tests and `pytest_views_rest` will silently
re-include them.

## Implementation Steps

### Step 1 — Update the CircleCI test-path split

In `.circleci/config.yml`:

- `pytest_views_characters` job (currently `poetry run pytest games/tests/views/characters/ --cov ...`):
  change the target path to `games/tests/views/game/`.
- `pytest_views_rest` job (currently
  `poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov ...`):
  change `--ignore=games/tests/views/characters/` to `--ignore=games/tests/views/game/`.
- `pytest_all` (currently `--ignore=games/tests/views/` — ignores all of `views/` regardless
  of subfolder) needs no change.

No other CircleCI job references `characters/` or any other path touched by this issue
(`urls.py`, `serializers/`, `models/`) — confirm with a repo-wide grep for `characters` and
`views/` inside `.circleci/config.yml` before considering this done, in case something was
missed here.

## Files to Change

- `.circleci/config.yml` — `pytest_views_characters` and `pytest_views_rest` job commands

## CI Checks

This change *is* the CI config — validate by triggering the pipeline on the PR branch (or
locally reviewing the two job commands) and confirming `pytest_views_characters` collects
the moved tests under `games/tests/views/game/` with a non-zero test count.

## Notes

- Purely a path rename in two `run` steps — no new jobs, images, or workflow wiring needed.
- Must land in the same PR/merge as backend's Step 2 (views move) — an intermediate commit
  with mismatched paths breaks CI (see Shared contracts).
