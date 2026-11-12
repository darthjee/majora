# API Contract

Part of the [Common Items Filters](../common-items-filters.md) specs (Epic #1766).

*Implemented by #1770 (backend), consumed by #1771 (frontend).* This page is the contract both
sides follow; if either has to deviate, it updates this page in the same PR. The rule numbers
below are stable: [Backend](backend.md), [Frontend](frontend.md) and [Testing](testing.md)
refer to them.

## Endpoints

| Method | URL | Permission | Returns |
|--------|-----|------------|---------|
| `GET` | `/games/<slug>/common_items.json` | `AllowAny` | Non-hidden items only |
| `GET` | `/games/<slug>/common_items/all.json` | `can_edit` (`GameEditPermission`) | All items, including hidden ones and the `hidden` field |

- Both indexes accept **exactly the same filters**.
- **No new endpoint and no new permission.** The filters are available to everyone, anonymous
  visitors included, on whichever index they can already read.

## Query params

| Param | Semantics | Status |
|-------|-----------|--------|
| `name` | Case-insensitive substring match on `name` | Existing (#1449) |
| `category` | Exact match against the 7 `GameCommonItem.CATEGORY_CHOICES` (`potion`, `drug`, `consumable`, `ammunition`, `poison`, `gear`, `other`) | New |
| `min_price` | `price__gte` | New |
| `max_price` | `price__lte` | New |

- All params are optional and combined with **AND**.
- **Order of application:** base queryset (the `hidden=False` filter on the public index) →
  query filters → pagination.

Precedent: the `category` filter follows the recipes filter
(`backend/games/views/game/recipes/_recipe_filters.py`, same `GameCommonItem.CATEGORY_CHOICES`),
not the tasks one (which ignores unknown values). The price filters follow the treasure value
filters (`_filter_by_value` in `backend/games/views/games/_treasure_filters.py`).

## Edge-case rules

| # | Case | Behaviour | Rationale |
|---|------|-----------|-----------|
| 1 | Unknown `category` (`?category=foo`) | Empty list, `200` | Same as recipes on the same choices: a filter that matches nothing returns nothing. |
| 2 | Empty `category` (`?category=`) | Treated as absent, no filter | Forms send blank fields. Deliberate deviation from recipes, which returns an empty list. |
| 3 | `category` case (`?category=Potion`) | No normalisation, so empty list | Stored values are lowercase; exact match, same as recipes. |
| 4 | Repeated `?category=potion&category=gear` | Last value wins (`query_params.get`) | The project's single-value pattern; multi-select is a non-goal. |
| 5 | Non-numeric price (`?min_price=abc`) | Ignored, as if absent | Same as treasures; index filters never answer `400`. |
| 6 | Empty price (`?min_price=`) | Ignored | Same as #5; forms send blank fields. |
| 7 | Decimal price (`?min_price=1.5`) | Ignored (`int()` fails) | `price` is an `IntegerField`; documented to avoid surprises. |
| 8 | Negative price (`?min_price=-1`) | Accepted, natural result | Harmless: no stored price is negative. |
| 9 | `min_price=0` | Applied, not treated as absent | The helper checks `is None`, not falsiness; must be tested. |
| 10 | `min_price > max_price` | Empty list, no cross-validation | Natural AND result. |
| 11 | Hidden item matching the filters on the public index | Never returned, no hint that it exists | The hidden filter is applied to the base queryset first. |
| 12 | Unknown game slug | `404` before any filter | Current behaviour. |
| 13 | Pagination with filters | `total` / `pages` reflect the filtered set; filters apply before pagination | Coherent paging; the frontend keeps the filters across pages. |
| 14 | Unknown params (`?foo=bar`, `?hidden=true` on the public index) | Silently ignored | Current behaviour; see the [filter-visibility rule](#filter-visibility-rule). |
| 15 | Leading/trailing spaces in `name` / `category` | Not trimmed by the backend; the frontend trims before sending | Same as the current `name` filter. |

## Filter-visibility rule

Per [Common rules](../../access-control/common-rules.md), neither index offers a filter on
`hidden`, `incognito` or `private_*` fields.

- `hidden` is a **returned field** on `all.json`, not a filter. A `?hidden=` filter is out of
  scope.
- `?hidden=true` on the public index is an unknown param (rule #14): it is ignored and never
  exposes hidden items (rule #11).

## Backward compatibility

- Purely additive: no serializer or response change.
- Requests without the new params behave exactly as today, including `?name=`.
