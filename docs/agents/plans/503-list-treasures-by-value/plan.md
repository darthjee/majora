# Plan: List treasures by value

Issue: [503-list-treasures-by-value.md](../issues/503-list-treasures-by-value.md)

## Overview

Add explicit ascending ordering by `value` (with `id` as a stable tiebreaker) to the
querysets behind the three treasure-listing endpoints. This is a scoped, view-level change —
no model, serializer, or migration changes are needed, and no other endpoint that happens to
query `Treasure`/`CharacterTreasure` (e.g. `treasure_detail`, `game_treasures_all`, the
exchange flow) is touched, since the issue only calls out these three endpoints.

## Context

- `Treasure.value` is a plain `IntegerField` (`backend/games/models/treasure.py:11`). No
  gold/silver/copper breakdown or Money model involved.
- `Treasure.Meta.ordering = ['id']` and `CharacterTreasure.Meta.ordering = ['id']` are the
  current defaults — neither view currently calls `.order_by(...)` explicitly, so results
  fall back to insertion (`id`) order.
- The PC treasures endpoint queries `CharacterTreasure` rows (treasure + quantity owned), not
  `Treasure` rows directly, so it must sort by `treasure__value`, not a local `value` field.
- Per discussion, sorting there uses the treasure's unit value (not `value × quantity`), and
  ties break by `id` (`treasure__id` for the PC endpoint) for stable pagination.

## Implementation Steps

### Step 1 — Order the global treasures list

In `backend/games/views/treasures/treasures_list.py:27`, change:
```python
treasures = Treasure.objects.filter(game__isnull=True)
```
to:
```python
treasures = Treasure.objects.filter(game__isnull=True).order_by('value', 'id')
```

### Step 2 — Order the per-game treasures list

In `backend/games/views/games/game_treasures.py:33`, change:
```python
treasures = Treasure.objects.filter(Q(linked_game=game) | Q(game=game)).distinct()
```
to:
```python
treasures = Treasure.objects.filter(Q(linked_game=game) | Q(game=game)).distinct()
treasures = treasures.order_by('value', 'id')
```
placed before (or after) the existing `.filter(hidden=False)` / `_filter_by_max_value` calls —
order doesn't matter relative to those since they don't touch ordering, but keep `.distinct()`
called before `.order_by()` for readability.

Leave `game_treasures_all.py` (a different, unrelated staff endpoint) untouched — it isn't one
of the three endpoints named in the issue.

### Step 3 — Order the PC treasures list

In `backend/games/views/characters/_treasures.py:22`, change:
```python
treasures = character.character_treasures.select_related('treasure').filter(quantity__gt=0)
```
to:
```python
treasures = character.character_treasures.select_related('treasure').filter(quantity__gt=0)
treasures = treasures.order_by('treasure__value', 'treasure__id')
```
This function (`character_treasures`) backs `game_pc_treasures.py`, the view behind
`/games/:game_slug/pcs/:id/treasures.json`.

### Step 4 — Update/extend tests

Update the existing tests for all three endpoints to assert value-ascending order (create
treasures with out-of-order values and assert the response lists them lowest-first), plus a
tie-breaking case (two treasures with equal `value`, asserting the lower-`id` one comes first):

- `backend/games/tests/views/treasures/treasures_list_test.py`
- `backend/games/tests/views/games/game_treasures_test.py`
- `backend/games/tests/views/characters/game_character_treasures_test.py`

## Files to Change

- `backend/games/views/treasures/treasures_list.py` — add `.order_by('value', 'id')`
- `backend/games/views/games/game_treasures.py` — add `.order_by('value', 'id')`
- `backend/games/views/characters/_treasures.py` — add `.order_by('treasure__value', 'treasure__id')`
- `backend/games/tests/views/treasures/treasures_list_test.py` — assert ascending order + tie-break
- `backend/games/tests/views/games/game_treasures_test.py` — assert ascending order + tie-break
- `backend/games/tests/views/characters/game_character_treasures_test.py` — assert ascending order + tie-break

## CI Checks

- `backend/games/tests/views/characters/`: `poetry run pytest games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)
- `backend/games/tests/views/` (excluding `characters/`): `poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)

## Notes

- No migration needed — this is query-level ordering only, not a model `Meta.ordering` change.
  `Meta.ordering` was deliberately left as `['id']` on both models to avoid changing behavior
  of other, unrelated queries (`treasure_detail`, `game_treasures_all`, the acquire/sell
  exchange flow, Django Admin) that weren't named in the issue.
- `.distinct()` followed by `.order_by('value', 'id')` is safe here since `value` and `id` are
  plain columns already included in the (unrestricted) `SELECT *`/`SELECT DISTINCT` — no
  `ORDER BY expression not in select list` issue arises.
