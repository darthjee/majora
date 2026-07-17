# Plan: Add filters in treasures page

Issue: [631-add-filters-in-treasures-page.md](../../issues/631-add-filters-in-treasures-page.md)

## Overview

Add a filter bar to the top-level `/#/treasures` page (unassigned treasures, `GET /treasures.json`) supporting game type (D&D/Deadlands), an inclusive value range (`min_value`/`max_value`), and a case-insensitive partial name match. The backend gains manual queryset filtering on `treasures_list`, following the exact pattern already used by `game_treasures.py`'s `_filter_by_max_value`/`_filter_by_search`. The frontend gains a new `TreasureFilters` element mirroring `NpcFilters`, wired through the existing `HashRouteResolver`/`Pagination` filter-persistence convention already used by the NPC list page. New UI strings get translation keys under the existing `treasures_page` namespace.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### `GET /treasures.json` — new query params (backend produces, frontend consumes)

| Param | Type | Behavior |
|---|---|---|
| `game_type` | string | One of `Game.GAME_TYPE_CHOICES` keys (`dnd`, `deadlands`). Exact match on `Treasure.game_type`. Any other/blank value is ignored (no filtering applied), same silent-ignore style as the existing `_filter_by_max_value` invalid-int handling in `game_treasures.py`. |
| `min_value` | integer | Inclusive lower bound: `value__gte=min_value`. Non-numeric values are ignored. |
| `max_value` | integer | Inclusive upper bound: `value__lte=max_value`. Non-numeric values are ignored. |
| `name` | string | Case-insensitive partial match: `name__icontains=name`. Blank/absent is ignored. |

All four filters are combinable (AND). Response body shape and `TreasureListSerializer` fields are unchanged. Existing ordering (`value`, `id`) is unchanged. Pagination headers/response envelope are unchanged — filters only narrow the queryset before pagination.

Note: this only affects the top-level `treasures_list` view (`/treasures.json`, unassigned treasures). The unrelated per-game `game_treasures.py` view (`/games/:slug/treasures.json`) already has its own separate `max_value`/`search` filtering and is not touched by this issue.

### Frontend → backend param names (frontend produces, backend consumes)

The frontend's filter UI and `HashRouteResolver.getFilterParams()` must send query params named exactly `game_type`, `min_value`, `max_value`, `name` — matching the backend param names above one-to-one, so `GenericClient#fetchIndex`'s `extraParams` can be passed straight through with no renaming.

### Translation keys (translator produces, frontend consumes)

New keys under the existing `treasures_page` namespace, consumed via `Translator.t('treasures_page.<key>')`:
`filter_game_type_label`, `filter_min_value_label`, `filter_max_value_label`, `filter_name_label`, `filter_name_placeholder`, `filter_query`, `filter_clear`.

The game type `<option>` labels themselves ("D&D" / "Deadlands") stay hardcoded literal text in the JSX, not translated — matching the existing convention in `TreasureNewHelper.jsx`'s game type `<select>`.
