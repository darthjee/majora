# Backend

Part of the [Common Items Filters](../common-items-filters.md) specs (Epic #1766).

*Implemented by #1770.* This page records where the filters from the
[API contract](api-contract.md) are applied and how the existing filter helpers were refactored
to support them.

## Chosen approach

Generic int-range helpers move to `backend/common/query_filters.py`, and the treasure helpers
become thin wrappers around them. Rejected alternatives:

- **Adding a `param` kwarg to `_treasure_filters.py`:** deepens the coupling of common items to
  the treasure module.
- **A standalone common items module duplicating the int parsing:** two copies of the same
  parsing rules would drift.

## Shared helpers

In `backend/common/query_filters.py`:

- `filter_by_min(request, queryset, param, field)`: applies `<field>__gte`.
- `filter_by_max(request, queryset, param, field)`: applies `<field>__lte`.

Both read `request.query_params` (the former `_filter_by_value` read `request.GET`, an alias on
a DRF `Request`). Parsing follows rules #5 to #9: an absent, empty or non-`int` value is
ignored; `0` and negative values are applied (the check is `is None`, not falsiness). Parsing is
exactly `int(value)`, identical to treasures, so Python `int()` quirks apply (`" 5"`, `"+5"` and
`"1_000"` are accepted): a nuance on rule #15, not a deviation.

## Treasure compatibility

**The pitfall this fixed:** the former helpers in
`backend/games/views/games/_treasure_filters.py` hard-coded the `min_value` / `max_value` param
names, so they could not serve `min_price` / `max_price`.

- `filter_by_min_value` / `filter_by_max_value` keep their signatures and are thin wrappers
  over the shared helpers (`param='min_value'` / `'max_value'`, default `field='game_value'`).
- `filter_by_name` is unchanged.
- None of the 8 callers (4 treasure views, 4 exchange views) changed.
- The module docstring points to `common/query_filters.py` as the canonical home of the shared
  helpers.

## Common items module

New `backend/games/views/games/_common_item_filters.py`, mirroring
`backend/games/views/game/recipes/_recipe_filters.py`:

- `filter_by_category(request, queryset)`: exact match against
  `GameCommonItem.CATEGORY_CHOICES`; an empty value is treated as absent; an unknown value gives
  `queryset.none()` (rules #1 to #4). It is **kept local**, not a generic `filter_by_choice` in
  `common/`: there is a single caller with these rules, and the recipes filter differs
  (hidden-output masking, empty value).
- `apply_common_item_filters(request, queryset)`: `name`, then `category`, then `min_price` /
  `max_price` on `price`.

## Views

`backend/games/views/games/game_common_items.py` and `game_common_items_all.py` each call
`apply_common_item_filters` once, on their respective base queryset (`hidden=False` for the
public one), before pagination (rules #11 and #13).

## Not touched

The recipes `category` filter (`backend/games/views/game/recipes/_recipe_filters.py`) stays as
it is: it masks hidden outputs and returns an empty list on an empty value, which is not the
behaviour decided for common items (rule #2).

## Cache

No Navi change: `navi/resources/common_items.yml` warms only unfiltered pages
(`?page=&per_page=`); filtered URLs are plain cache misses.

## Docs updated in #1770

- [Game Common Item access control](../../access-control/game-common-item.md): the `?name=`
  filter section now documents the new params.
