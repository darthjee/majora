# Backend Plan: Improve Treasure Exchange Modal (Search, Sorting, Money Display, Button Rename)

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" — this agent adds `search`/`ordering` to
`GET /games/<game_slug>/treasures.json` and `search` to
`GET /games/<game_slug>/pcs/<id>/treasures.json` (shared with `.../npcs/<id>/treasures.json`
via `_treasures.py`). No model, migration, or serializer changes — both endpoints only gain
query-param filtering/ordering, following the existing manual `request.GET.get(...)` style
already used by `_filter_by_max_value` (no `django-filter` anywhere in this codebase).

## Implementation Steps

### Step 1 — Acquire endpoint: `search` + `ordering`
`backend/games/views/games/game_treasures.py`:
- Add `_filter_by_search(request, treasures)`, mirroring `_filter_by_max_value`'s shape:
  read `request.GET.get('search')`; if present and non-empty, `.filter(name__icontains=search)`.
- Add `_apply_ordering(request, treasures)`: read `request.GET.get('ordering')`; if it equals
  `'desc'`, `.order_by('-value', 'id')`; otherwise (missing, `'asc'`, or any other value)
  `.order_by('value', 'id')` (today's default).
- In `game_treasures()`, replace the hardcoded `treasures.order_by('value', 'id')` (line 34)
  with a call to `_apply_ordering(request, treasures)` placed after the `hidden=False` filter
  (order of filter/ordering calls doesn't matter functionally, but keep the existing
  `Q(...)/distinct()` → `hidden=False` → filters → ordering flow for readability), and chain in
  `_filter_by_search(request, treasures)` alongside `_filter_by_max_value`.

### Step 2 — Sell endpoint: `search`
`backend/games/views/game/_treasures.py`'s `character_treasures()`:
- After building `treasures = character.character_treasures.select_related('treasure').filter(quantity__gt=0)`
  and before/after the existing `.order_by('treasure__value', 'treasure__id')` (order doesn't
  matter), add: read `request.GET.get('search')`; if present and non-empty,
  `.filter(treasure__name__icontains=search)`. This function is shared by both
  `game_pc_treasures.py` and `game_npc_treasures.py`, so both endpoints get the param for free.

### Step 3 — Tests
- `backend/games/tests/views/games/game_treasures_test.py`: add cases for `search` (matches
  substring, case-insensitive, no match returns empty list, combined with `max_value`) and
  `ordering` (`desc` reverses order by `value`; missing/invalid falls back to ascending; a
  request with no `ordering` still returns today's ascending order, to guard the unrelated Game
  Treasures page's behavior).
- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasures_test.py` and
  `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasures_test.py`: add `search`
  cases (substring match, case-insensitive, no match).

## Files to Change
- `backend/games/views/games/game_treasures.py` — `search` filter + `ordering` param.
- `backend/games/views/game/_treasures.py` — `search` filter.
- `backend/games/tests/views/games/game_treasures_test.py` — new test cases.
- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasures_test.py` — new test cases.
- `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasures_test.py` — new test cases.

## CI Checks
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — covers `game_treasures_test.py`.
- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`) —
  covers the PC/NPC treasures test files.
- `backend`: `poetry run ruff check .` (CI job: `checks`).

## Notes
- `ordering` intentionally defaults to today's ascending behavior so every existing caller of
  `GET /games/<game_slug>/treasures.json` that doesn't pass it (notably the unrelated Game
  Treasures management page) is unaffected — only the frontend agent's acquire-tab call will
  pass `ordering=desc`.
- `icontains` already performs a case-insensitive substring match in Django's ORM (translates to
  `ILIKE` on Postgres), matching the issue's "LIKE, any part of the name" + the confirmed
  case-insensitive requirement with no extra normalization needed.
