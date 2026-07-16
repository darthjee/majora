# Plan: Index pages should have 24 default pagination

Issue: [566-index-pages-should-have-24--default-pagination.md](../issues/566-index-pages-should-have-24--default-pagination.md)

## Overview

Change the single shared default page size used by all paginated index endpoints from 16 to 24, so it falls back to when the `MAJORA_PAGINATION_SIZE` env var is not set. This is a backend-only change (`Settings.pagination_size()`); the frontend has no hardcoded page size and simply relies on whatever the backend returns, so no frontend work is required.

## Context

`Settings.pagination_size()` in `backend/games/settings.py` reads `MAJORA_PAGINATION_SIZE` from the environment, defaulting to 16 when unset or invalid. `Paginator._per_page()` in `backend/games/paginator.py` uses this as the fallback when a request doesn't send its own `per_page` query param. This paginator backs `paginated_list_response()` in `backend/games/views/common.py`, which is reused by essentially every index endpoint (games, PCs, NPCs, treasures, photos, sessions, polls, tasks, staff users list).

24 was chosen because it divides evenly across the 2/3/4-cards-per-row grid breakpoints (`col-sm-6 col-md-4 col-lg-3`) used on card-grid index pages like Games, avoiding a partial trailing row.

Out of scope: `backend/games/session_message_paginator.py`'s hardcoded `PAGE_SIZE = 20`, which paginates session chat messages via cursor pagination — a separate mechanism, not the shared index-page paginator this issue targets.

## Implementation Steps

### Step 1 — Update the default in `Settings.pagination_size()`

In `backend/games/settings.py`, change both occurrences of the literal default from `16` to `24`:
- the `int(os.environ.get('MAJORA_PAGINATION_SIZE', 16))` fallback (line 13)
- the `except` branch returning `16` when the env var is invalid (line 15)

### Step 2 — Update existing tests asserting the old default

`backend/games/tests/settings_test.py` (`TestSettingsPaginationSize`) currently asserts `Settings.pagination_size() == 16` in three places (env not set, env invalid, env empty). Update all three assertions to `== 24`, and update the docstring/comment wording that references "16".

### Step 3 — Check other tests relying on the implicit default

`backend/games/tests/paginator_test.py` and `backend/games/tests/views/game/npcs/game_npcs_test.py` explicitly set `MAJORA_PAGINATION_SIZE` via `monkeypatch.setenv(...)` in the cases that exercise non-default sizes, so they aren't affected. Search both files (and any other paginated-view test) for assertions that rely on the *unset*-env-var default resolving to 16 items, and update those to 24 if found.

### Step 4 — Update documentation

`docs/agents/pagination.md` line 16 documents `Settings.pagination_size()  # reads MAJORA_PAGINATION_SIZE env var, defaults to 16`. Update this comment to say "defaults to 24".

## Files to Change

- `backend/games/settings.py` — change both literal `16` defaults in `pagination_size()` to `24`
- `backend/games/tests/settings_test.py` — update the three `TestSettingsPaginationSize` assertions from `16` to `24`
- `backend/games/tests/paginator_test.py` — verify/update any assertion relying on the implicit default
- `backend/games/tests/views/game/npcs/game_npcs_test.py` — verify/update any assertion relying on the implicit default
- `docs/agents/pagination.md` — update the documented default from 16 to 24

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers `settings_test.py` and `paginator_test.py`
- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`) — covers `game_npcs_test.py`

## Notes

- No `MAJORA_PAGINATION_SIZE` env var is set in `docker-compose*.yml` or CI job configs, so no infra changes are needed — the new default takes effect automatically wherever the env var isn't explicitly overridden.
- No frontend changes needed: `GenericClient.fetchIndex` and `HashRouteResolver` don't hardcode a page size; they only forward `per_page` when explicitly present in the URL and otherwise defer entirely to the backend response.
