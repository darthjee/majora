# Issue: Add category and price-range filters to the game common items index (backend)

## Description

Part of Epic #1766. Add `category`, `min_price` and `max_price` filters, next to the existing `name` filter, to both game common items indexes. The specs were merged in #1774 (#1769): **follow [`docs/agents/specs/common-items-filters.md`](../specs/common-items-filters.md) and its [`api-contract.md`](../specs/common-items-filters/api-contract.md), [`backend.md`](../specs/common-items-filters/backend.md) and [`testing.md`](../specs/common-items-filters/testing.md) pages**; where this issue and the specs disagree, the specs win.

Owner: **backend** agent only.

## Problem

`GET /games/<slug>/common_items.json` (AllowAny, non-hidden only) and `GET /games/<slug>/common_items/all.json` (GameEdit, includes hidden, exposes `hidden`) today accept only `?name=` (`filter_by_name` from `common/query_filters.py`). Both are paginated via `paginated_list_response`, ordered by `id`.

The existing int-range helpers `filter_by_min_value` / `filter_by_max_value` in `backend/games/views/games/_treasure_filters.py` hard-code the `min_value` / `max_value` query-param names, so they cannot serve `min_price` / `max_price` by passing `field='price'` alone.

## Expected Behavior

- Both indexes accept `name`, `category`, `min_price`, `max_price`, combined with AND.
- `category` is an exact match (rules #1–#4): unknown value → empty list (200, no 400); empty value → ignored; no case normalisation; repeated param → last value wins.
- `min_price` (`price__gte`) / `max_price` (`price__lte`) follow rules #5–#10: absent, empty, non-numeric or decimal values are ignored; `0` and negative values are applied; `min_price > max_price` → empty list.
- Hidden items never appear on the public index, whatever the filters; `all.json` returns them when they match.
- Pagination headers reflect the filtered total.
- Requests without the new params return exactly today's result.

### Acceptance criteria

- [ ] Both indexes accept `name`, `category`, `min_price`, `max_price`, combinable with AND
- [ ] Unknown `category` returns an empty list (no 400); empty `category` is ignored; price edge cases follow rules #5–#10
- [ ] No filter on `hidden` / `incognito` / `private_*` on the public endpoint; hidden items never leak on it
- [ ] Pagination headers reflect the filtered total
- [ ] Existing treasure view tests pass **unmodified**
- [ ] Tests cover the backend matrix in `testing.md`
- [ ] `game-common-item.md` and `backend.md` updated

## Solution

1. **Shared helpers** — `filter_by_min(request, queryset, param, field)` / `filter_by_max(...)` in `backend/common/query_filters.py`, reading `request.query_params`, applying `<field>__gte` / `<field>__lte`.
2. **Treasure wrappers** — `filter_by_min_value` / `filter_by_max_value` in `backend/games/views/games/_treasure_filters.py` become thin wrappers (`param='min_value'` / `'max_value'`, default `field='game_value'`), same signatures; none of the 8 callers change; the module docstring points to `common/query_filters.py`.
3. **Common items module** — new `backend/games/views/games/_common_item_filters.py` (mirroring `game/recipes/_recipe_filters.py`) with `filter_by_category(request, queryset)` (kept local, not a generic `filter_by_choice`) and `apply_common_item_filters(request, queryset)` (`name` → `category` → `min_price`/`max_price` on `price`).
4. **Views** — `game_common_items.py` and `game_common_items_all.py` call `apply_common_item_filters` once on their base queryset (`hidden=False` for the public one), before pagination; docstrings list the four filters.
5. **Tests** — per `testing.md`: shared helper unit tests in `backend/common/tests/query_filters_test.py`; the common items filters module and both views under the mirrored tree `backend/games/tests/views/games/`.
6. **Docs** — `docs/agents/access-control/game-common-item.md` documents the four filters on both indexes; `docs/agents/specs/common-items-filters/backend.md` drops its "Planned by #1770 / nothing exists yet" banner and describes the implemented state.

### Backward compatibility

- **`request.GET` → `request.query_params` is safe:** all 8 treasure callers pass a DRF `Request` (the same requests already go through `filter_by_name`, which reads `query_params`), and on a DRF `Request` `query_params` is an alias of the underlying `GET`.
- **Parsing stays exactly `int(value)` + `except ValueError`**, identical to today's `_filter_by_value`, so treasure filtering is unchanged — including Python `int()` quirks: `" 5"` → 5, `"+5"` → 5, `"1_000"` → 1000, `"5.5"` / `""` → ignored. The same applies to `min_price`/`max_price`; this is documented as "price params follow Python `int()` parsing, identical to treasures", a nuance on rule #15 (no backend trimming), not a deviation to fix.
- **Common items endpoints are purely additive:** without the new params the queryset, order (`id`), pagination and `?name=` behaviour are unchanged; no serializer or response change.
- **Proxy / Navi:** filtered URLs are distinct cache keys (plain misses); unfiltered pages stay warm — no Navi change.

### Out of scope

- Frontend filter bar (#1771).
- Navi / cache changes (none needed, per the specs).
- Removing the specs (#1772).
- The recipes `category` filter, serializers, response shape, and DB indexes.
- New filters on treasure endpoints.

## Benefits

- Players and editors can narrow the common items list by category and price, server-side, with correct pagination.
- The int-range filter parsing lives in one shared place instead of being tied to the treasure module.
- Unblocks the frontend filter bar (#1771).
