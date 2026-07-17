# Backend Plan: Add filters in treasures page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the new `GET /treasures.json` query params (`game_type`, `min_value`, `max_value`, `name`) documented in [plan.md](plan.md)'s "Shared contracts" section — exact param names, filter semantics (inclusive bounds, case-insensitive `name` contains, exact `game_type` match, all combinable with AND, invalid values silently ignored) must match precisely, since the frontend sends these names verbatim.

## Implementation Steps

### Step 1 — Add filter helpers to `treasures_list.py`

In `backend/games/views/treasures/treasures_list.py`, add four private helpers mirroring the style of `_filter_by_max_value`/`_filter_by_search` in `backend/games/views/games/game_treasures.py:48-68`:

- `_filter_by_game_type(request, treasures)` — reads `request.GET.get('game_type')`; if the value is one of the `Game.GAME_TYPE_CHOICES` keys (import `Game` from `...models`), apply `treasures.filter(game_type=game_type)`; otherwise return `treasures` unfiltered (blank, missing, or unrecognized values are ignored, not errors).
- `_filter_by_min_value(request, treasures)` — reads `min_value`, `int()`-parses it inside a `try`/`except ValueError` (return unfiltered on failure, same as `_filter_by_max_value`), applies `treasures.filter(value__gte=min_value)`.
- `_filter_by_max_value(request, treasures)` — same shape, `treasures.filter(value__lte=max_value)`. Note: unlike `game_treasures.py`'s version, this filters directly on `Treasure.value` (no `game_value` annotation — these are unassigned treasures with no `GameTreasure` override), so do not copy the annotation/Subquery logic, just the int-parsing/filter shape.
- `_filter_by_name(request, treasures)` — reads `request.GET.get('name')` (not `search` — the issue asks for a `name` param specifically), if truthy applies `treasures.filter(name__icontains=name)`.

### Step 2 — Wire the filters into the view

In `treasures_list()`, after the existing `treasures = Treasure.objects.filter(game__isnull=True).order_by('value', 'id')` line, chain the four filters before calling `paginated_list_response`:

```python
treasures = Treasure.objects.filter(game__isnull=True)
treasures = _filter_by_game_type(request, treasures)
treasures = _filter_by_min_value(request, treasures)
treasures = _filter_by_max_value(request, treasures)
treasures = _filter_by_name(request, treasures)
treasures = treasures.order_by('value', 'id')
return paginated_list_response(request, treasures, TreasureListSerializer)
```

(Moving `.order_by(...)` after the filters is cosmetic only — Django querysets are lazy, so filter/order_by order doesn't change behavior; keep whichever ordering reads more clearly.)

### Step 3 — Tests

Extend `backend/games/tests/views/treasures/treasures_list_test.py`, following that file's existing setup/assertion style (and cross-checking `backend/games/tests/views/games/game_treasures_test.py` for the equivalent `max_value`/`search` test shapes). Cover:

- `game_type` filter: only matching-type treasures returned; an unrecognized/blank `game_type` value returns the unfiltered list.
- `min_value`/`max_value`: inclusive boundaries (a treasure with `value` exactly equal to `min_value` or `max_value` is included); non-numeric values are ignored (unfiltered list returned, no 400/500).
- `name` filter: case-insensitive partial match (e.g. filtering by `sword` matches a treasure named `Iron Sword`); blank/absent `name` returns unfiltered list.
- Combined filters: two or more filters applied together narrow the list via AND (not OR).
- Confirm filtering still respects the existing `game__isnull=True` scoping (a game-exclusive treasure matching all filter values is still excluded).

## Files to Change

- `backend/games/views/treasures/treasures_list.py` — add the four filter helpers and wire them into `treasures_list()`.
- `backend/games/tests/views/treasures/treasures_list_test.py` — add filter test coverage described above.

## CI Checks

- `backend`: `docker-compose run --rm majora_app poetry run pytest games/tests/views/treasures/treasures_list_test.py --cov` (CI job: `pytest_views_rest`)

## Notes

- No model or migration changes needed — `Treasure.game_type`/`value`/`name` already exist exactly as needed (`backend/games/models/treasure/treasure.py`).
- No serializer changes needed — `TreasureListSerializer` already exposes `game_type`, `value`, `name`.
