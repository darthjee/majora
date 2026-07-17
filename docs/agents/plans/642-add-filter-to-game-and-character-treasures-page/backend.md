# Backend Plan: Add filter to game and character treasures page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces `min_value`/`max_value`/`name` query-param filtering (see [plan.md](plan.md)'s
"Shared contracts" for exact semantics) on:

- `GET /games/<slug>/treasures.json` (`game_treasures`)
- `GET /games/<slug>/treasures/all.json` (`game_treasures_all`)
- `GET /games/<slug>/pcs/<id>/treasures.json` (`game_pc_treasures`)
- `GET /games/<slug>/npcs/<id>/treasures.json` (`game_npc_treasures`)
- `GET /games/<slug>/npcs/<id>/treasures/all.json` (`game_npc_treasures_all`)

`search` is removed as a query param (renamed to `name`) — frontend is being updated in the
same issue to match, so this is not a breaking-change concern here.

## Implementation Steps

### Step 1 — Extract shared filter helpers

The same filter shape (parse an optional query param, ignore blank/invalid, apply a
`__gte`/`__lte`/`__icontains` lookup) is currently duplicated between
`treasures_list.py`, `game_treasures.py`, and `game/_treasures.py`, and needs to land on two
more call sites (`game_treasures_all.py`, and — for free — both NPC-treasures views that
route through `character_treasures()`). Extract it into a new shared module
`backend/games/views/games/_treasure_filters.py`, following the same pattern as the existing
`backend/games/views/games/_treasure_context.py` (a small private helper file imported via
relative import from both `games/` and `game/_treasures.py`). Suggested shape (adjust names/
signatures to fit call sites cleanly — some filter on a `game_value` annotation, others on
`treasure__name` via a related field):

```python
def filter_by_min_value(request, queryset, field='game_value'):
    """Filter `queryset` to `<field>__gte` an optional `min_value` query param."""
    ...

def filter_by_max_value(request, queryset, field='game_value'):
    ...

def filter_by_name(request, queryset, field='name'):
    """Filter `queryset` to a case-insensitive substring match on `<field>` from `name`."""
    ...
```

Do not touch `treasures_list.py` (the global endpoint) — its own `_filter_by_*` functions
already do the right thing and are out of scope for this issue (no `game_type` involved
there).

### Step 2 — `game_treasures` (`backend/games/views/games/game_treasures.py`)

- Replace the local `_filter_by_max_value`/`_filter_by_search` with the shared helpers from
  Step 1.
- Add a `min_value` filter on the `game_value` annotation (already computed at line 41 via
  `Coalesce(game_value, 'value')`), applied alongside the existing `max_value` filter.
- Rename the `search` param to `name` (`_filter_by_search` → use `filter_by_name`).

### Step 3 — `game_treasures_all` (`backend/games/views/games/game_treasures_all.py`)

This view currently applies **no** filtering or `game_value` annotation at all — it just
returns every treasure linked to the game. Bring it up to the same shape as `game_treasures`:

- Annotate the queryset with the same `game_value = Coalesce(game_value_subquery, 'value')`
  pattern used in `game_treasures.py` (lines 37-41) — extract that annotation step into a
  small shared helper too if it avoids real duplication, otherwise duplicating the four-line
  annotation is acceptable per this project's "no premature abstraction" convention.
- Apply `filter_by_min_value`, `filter_by_max_value`, `filter_by_name` (all on `game_value`/
  `name`) using the Step 1 helpers.
- Preserve existing behavior otherwise (permission check, `X-Skip-Cache`, hidden treasures are
  intentionally still included here since this is the DM/editor "all" variant).

### Step 4 — `character_treasures()` (`backend/games/views/game/_treasures.py`)

- Add `filter_by_min_value`/`filter_by_max_value` on the existing `game_value` annotation
  (line 47), applied alongside the existing search filtering.
- Rename `_filter_by_search` to use the shared `filter_by_name`, with `field='treasure__name'`
  (matching the current lookup at line 73).
- This one change is inherited automatically by `game_pc_treasures`, `game_npc_treasures`,
  and `game_npc_treasures_all`, since they all call this shared function — no changes needed
  in those three view files themselves.

### Step 5 — Tests

Update/add cases in the mirrored test tree:

- `backend/games/tests/views/games/game_treasures_test.py` — existing `max_value`/`search`
  coverage should move to `min_value`/`max_value`/`name`; add `min_value` cases.
- `backend/games/tests/views/games/game_treasures_all_test.py` — add new coverage for
  `min_value`/`max_value`/`name` (none exists today since the view had no filtering).
- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasures_test.py` — add
  `min_value`/`max_value`/`name` cases (rename any existing `search` case to `name`).
- `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasures_test.py` and
  `game_npc_treasures_all_test.py` — same additions.
- If Step 1's shared helpers are non-trivial enough to warrant direct unit tests, add them
  under a mirrored `backend/games/tests/views/games/_treasure_filters_test.py` — otherwise the
  view-level tests above are sufficient coverage.

## Files to Change

- `backend/games/views/games/_treasure_filters.py` — new shared filter helpers.
- `backend/games/views/games/game_treasures.py` — use shared helpers, add `min_value`, rename
  `search` → `name`.
- `backend/games/views/games/game_treasures_all.py` — add `game_value` annotation and all
  three filters (currently has none).
- `backend/games/views/game/_treasures.py` — use shared helpers, add `min_value`/`max_value`,
  rename `search` → `name`.
- `backend/games/tests/views/games/game_treasures_test.py`,
  `backend/games/tests/views/games/game_treasures_all_test.py`,
  `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasures_test.py`,
  `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasures_test.py`,
  `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasures_all_test.py` —
  updated/new filter coverage.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`) —
  covers the PC/NPC treasures test files.
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — covers the `games/` treasures test files.
- `backend`: `poetry run ruff check .` (CI job: `checks`).

## Notes

- No new entity, endpoint, or access/ownership rule is introduced — every change is additive
  filtering on existing, already-`AllowAny` GET endpoints, so `product-owner`/`security`/
  `data-access` review is not needed for this issue.
- `game_type` is deliberately not added anywhere in this plan — see [plan.md](plan.md).
- Coordinate the `search` → `name` rename with the frontend agent's work (see
  [frontend.md](frontend.md)) so both land together; this is not meant to ship as two
  separately-deployable steps.
