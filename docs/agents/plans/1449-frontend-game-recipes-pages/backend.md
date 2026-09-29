# Backend Plan: Frontend: game Recipes pages

Main plan: [plan.md](plan.md)

## Shared contracts

Produce the common-item `?name=` filter described in [plan.md](plan.md#common-item-name-filter-backend--frontend):
optional, case-insensitive substring match on `GameCommonItem.name`, on both
`common_items.json` and `common_items/all.json`, with pagination, response shape, hidden
filtering and the `/all.json` GameEdit gate unchanged.

## Implementation Steps

### Step 1 — Add `?name=` to the common-item indexes
In `backend/games/views/games/game_common_items.py` (GET branch only, not the POST create) and
`backend/games/views/games/game_common_items_all.py` (after the `check_game_edit` gate), pass the
queryset through the existing shared helper `common/query_filters.py#filter_by_name` before
`paginated_list_response`, the same way `game_sessions/game_sessions_list.py` and
`game/recipes/_character_recipes.py` do. Update both docstrings to mention the optional `name`
param.

### Step 2 — Tests
Add view tests next to the existing common-item index tests (`backend/games/tests/views/...`,
find them with `grep -rl "game-common-items" backend/games/tests`):
- `?name=` matches case-insensitively on a substring and excludes non-matching items.
- Empty / absent `name` returns the unfiltered list.
- On `common_items.json`, a hidden item matching the name is still excluded.
- On `common_items/all.json`, a hidden matching item is returned for a GameEdit caller, and
  non-GameEdit callers still get the existing 401/403 (the filter must not bypass the gate).
- `?name=` combines with `per_page`.

## Files to Change
- `backend/games/views/games/game_common_items.py` — apply `filter_by_name` on GET.
- `backend/games/views/games/game_common_items_all.py` — apply `filter_by_name` after the gate.
- `backend/games/tests/views/.../game_common_items*_test.py` — new cases above.

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/` (CI jobs running
  `pytest games/tests/views/...`), plus the backend lint used by the repo's CI.

## Notes
- No new endpoint, field or permission, but the filter is new user input on an index →
  `data-access` and `security` should review the diff (read-only reviewers).
- No Navi change: searches are ad-hoc queries, not warmed resources; `/all.json` already sets
  `X-Skip-Cache`.
