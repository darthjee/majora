# Issue: Write the common items filters specs

## Description

Part of Epic #1766 (filters on the game common items index and page). Docs only, no code.

`GameCommonItem` is the per-game catalog of common items (`price`, `category` with 7 fixed choices: `potion`, `drug`, `consumable`, `ammunition`, `poison`, `gear`, `other`). The catalog exists to browse by price and category, but today:

- `GET /games/<slug>/common_items.json` (AllowAny, non-hidden only) and `GET /games/<slug>/common_items/all.json` (GameEdit, includes hidden) accept only `?name=` (#1449).
- The common items page (`frontend/assets/js/components/resources/common_item/pages/GameCommonItems.jsx`) has no filter UI at all.

The Epic adds `category`, `min_price` and `max_price` to both indexes (backend), then a filter bar on the page (frontend). This sub-issue writes the specs that both follow.

## Problem

The Epic is split into a backend sub-issue (#1770), a frontend sub-issue (#1771) and a cleanup sub-issue (#1772). They share a contract (query params, edge-case behaviour, helper layout, filter bar behaviour) that has to be fixed once, before either implementation starts. Otherwise each side would make its own call on the open questions, and the two could diverge.

All of those decisions were made while enhancing this issue (see *Decisions* below). What's left is to write them down as specs.

## Expected Behavior

These pages exist, following the layout of `docs/agents/specs/statistics-bug.md`:

| Page | Content | Followed by |
| --- | --- | --- |
| `docs/agents/specs/common-items-filters.md` | Overview, links to the aspect pages, sub-issue → page(s) table, Lifecycle section (removed by #1772), non-goals | all |
| `docs/agents/specs/common-items-filters/api-contract.md` | Query params on both indexes, semantics (AND, exact `category`, `price__gte` / `price__lte`), edge-case rules #1 to #15 with rationale, permissions and filter-visibility rule | #1770, #1771 |
| `docs/agents/specs/common-items-filters/backend.md` | Where filters apply, helper refactor (including the param-name fix), no Navi change | #1770 |
| `docs/agents/specs/common-items-filters/frontend.md` | Filter bar interaction model, query building, hash state, paging, translations, variant selection | #1771 |
| `docs/agents/specs/common-items-filters/testing.md` | Backend and frontend test matrix derived from the decisions: each filter alone, combinations, edge cases #1 to #15, public/restricted pair, pagination headers, helper unit tests, treasure regression, filter bar element/controller/helper and page wiring | #1770, #1771 |

Sub-issue table for the index page:

| Issue | Title | Page(s) |
| --- | --- | --- |
| #1769 | Write the common items filters specs | all |
| #1770 | Add category and price-range filters to the game common items index (backend) | api-contract, backend, testing |
| #1771 | Add a filter bar to the game common items page (frontend) | api-contract, frontend, testing |
| #1772 | Remove the common items filters specs | all |

### Acceptance criteria

- [ ] Index page and the four aspect pages exist under `docs/agents/specs/`
- [ ] Every rule in *Decisions* is recorded in the page it names, with its rationale
- [ ] `backend.md` records the helper refactor (including the param-name fix) and the no-Navi-change note
- [ ] The index table maps each sub-issue of #1766 to its page(s)

## Solution

Write the pages above by recording the decisions below. Nothing is left open: if writing surfaces a gap, record the most conservative option consistent with these decisions and flag it in the PR description.

### Scope boundaries

- **Pages:** the index `common-items-filters.md` plus four aspect pages: `api-contract.md`, `backend.md`, `frontend.md` and `testing.md`. No separate decisions, cache or security page.
- **Rationale inline:** each rule in `api-contract.md` carries a short *Rationale* note, so the "why" stays next to the rule (and can be moved into `docs/agents/access-control/game-common-item.md` when #1772 removes the specs).
- **Cache:** `navi/resources/common_items.yml` warms only unfiltered pages (`?page=&per_page=`); filtered requests are plain cache misses. `backend.md` states this in one line ("no Navi change; filtered URLs are not warmed").
- **Security/access:** the filter-visibility rule and the public/restricted pair live in `api-contract.md`.
- **Decisions are made in this issue, not in the PR:** every open question is resolved in the *Decisions* section of this issue, and the specs only record them. That makes this a mechanical writing task.
- **Not in the specs:** implementation plans (produced by `/plan-issue` on #1770 / #1771). Non-goals listed explicitly: ordering by price, multi-select category, detail-page filters, other resources' filter bars.

### Decisions

#### API edge cases

To be recorded in `api-contract.md`, each rule with its rationale. Precedent: the `category` filter follows the recipes filter (`backend/games/views/game/recipes/_recipe_filters.py`, same `GameCommonItem.CATEGORY_CHOICES`), not the tasks one (which ignores unknown values); the price filters follow treasures (`_filter_by_value`).

| # | Case | Behaviour | Rationale |
| --- | --- | --- | --- |
| 1 | Unknown `category` (`?category=foo`) | Empty list, 200 | Same as recipes on the same choices: a filter that matches nothing returns nothing |
| 2 | Empty `category` (`?category=`) | Treated as absent, no filter | Forms send blank fields. Deliberate deviation from recipes (which returns an empty list) |
| 3 | `category` case (`?category=Potion`) | No normalisation, so empty list | Stored values are lowercase; exact match, same as recipes |
| 4 | Repeated `?category=potion&category=gear` | Last value wins (`query_params.get`) | Project's single-value pattern; multi-select is a non-goal |
| 5 | Non-numeric price (`?min_price=abc`) | Ignored, as if absent | Same as treasures; no 400s on index filters |
| 6 | Empty price (`?min_price=`) | Ignored | Same as 5; blank form fields |
| 7 | Decimal price (`?min_price=1.5`) | Ignored (`int()` fails) | `price` is an `IntegerField`; documented to avoid surprises |
| 8 | Negative price (`?min_price=-1`) | Accepted, natural result | Harmless: no stored price is negative |
| 9 | `min_price=0` | Applied, not treated as absent | The helper checks `is None`; must be tested |
| 10 | `min_price > max_price` | Empty list, no cross-validation | Natural AND result |
| 11 | Hidden item matching the filters on the public index | Never returned, no hint it exists | Hidden filter applied to the base queryset first |
| 12 | Unknown game slug | 404 before any filter | Current behaviour |
| 13 | Pagination with filters | `total` / `pages` reflect the filtered set; filters apply before pagination | Coherent paging; frontend keeps filters across pages |
| 14 | Unknown params (`?foo=bar`, `?hidden=true` on the public index) | Silently ignored | Current behaviour; filter-visibility rule |
| 15 | Leading/trailing spaces in `name` / `category` | Not trimmed by the backend; the frontend trims before sending | Same as the current `name` filter |

#### Helper refactor

To be recorded in `backend.md`. Chosen over (B) adding a `param` kwarg to `_treasure_filters.py` (deepens the treasure coupling) and (C) a standalone module duplicating the int parsing.

- **Generic int-range helpers in `common/query_filters.py`:** `filter_by_min(request, queryset, param, field)` (`<field>__gte`) and `filter_by_max(request, queryset, param, field)` (`<field>__lte`), reading `request.query_params` (today `_filter_by_value` reads `request.GET`). Parsing as decided above: absent, empty or non-`int` value is ignored; `0` and negatives are applied.
- **`games/views/games/_treasure_filters.py` keeps its public API:** `filter_by_min_value` / `filter_by_max_value` keep their signatures and become thin wrappers (`param='min_value'` / `'max_value'`, default `field='game_value'`); `filter_by_name` is unchanged. None of its 8 callers (4 treasure views, 4 exchange views) change. Its docstring points to `common/query_filters.py` as the canonical home of the shared helpers.
- **New `games/views/games/_common_item_filters.py`** (mirrors `game/recipes/_recipe_filters.py`):
  - `filter_by_category(request, queryset)`: exact match against `GameCommonItem.CATEGORY_CHOICES`, empty value treated as absent, unknown value gives `queryset.none()` (decisions #1 to #4). Kept local, not a generic `filter_by_choice` in `common/`: there is a single caller with these rules, and the recipes filter differs (hidden-output masking, empty value).
  - `apply_common_item_filters(request, queryset)`: name, then category, then `min_price` / `max_price` on `price`.
- **Both views** (`game_common_items.py`, `game_common_items_all.py`) call `apply_common_item_filters` once, on their respective base queryset (`hidden=False` for the public one).
- **The recipes filter is not touched.**
- **Tests:** unit tests for `filter_by_min` / `filter_by_max` in `common/tests/query_filters_test.py`; tests for `_common_item_filters.py` in the mirrored tree; treasure and exchange view tests stay unchanged as the regression guard.

#### Frontend interaction model

To be recorded in `frontend.md`. Chosen over (B) apply on change (needs a debounce the project doesn't have; extra requests while typing) and (C) a mix (two behaviours in one bar, unclear what happens to typed-but-unsubmitted prices).

- **Treasure-style draft form:** fields in order name, category dropdown ("all" + the 7 choices), min price, max price, then `common/forms/FilterActions.jsx` (Query / Clear). Nothing is sent until Query; Enter in a text field triggers Query. Structure mirrors `TreasureFilters` (element + controller + helper), using `utils/filters/buildFilterQuery.js`.
- **Query building:** `name` trimmed (decision #15); blank fields omitted; "all" categories means `category` is not sent.
- **Hash state:** all four fields pre-filled from `HashRouteResolver().getFilterParams()` on load; the page passes `activeFilters` to the list like `GameTreasures` / `GameRecipes`, so filtered URLs are shareable.
- **Paging:** Query resets to page 1; Clear empties the fields and the hash filters and returns to page 1.
- **Translations:** category option labels translated in every language under `frontend/assets/i18n/`, values stay the API's lowercase keys. Reuse existing category labels from the common item edit form if present before adding new keys.
- **Price inputs:** `type="number"`, `min="0"`, `step="1"`, as hints only; the backend rules (decisions #5 to #8) still apply.
- **Same bar for everyone:** regular viewers and editors see the same filter bar.

#### Permissions

To be recorded in `api-contract.md` (backend side) and `frontend.md` (variant selection).

- **The filters are available to everyone**, anonymous visitors included. No new permission, no new endpoint.
- `GET /games/<slug>/common_items.json` stays `AllowAny` (non-hidden items only); `GET /games/<slug>/common_items/all.json` stays gated by `can_edit` (`GameEditPermission`, includes hidden items and the `hidden` field). Both accept exactly the same four filters.
- **Filter-visibility rule** (`docs/agents/access-control/common-rules.md`): no filter on `hidden`, `incognito` or `private_*` on either index. `hidden` is a returned field on `all.json`, not a filter; a `?hidden=` filter is out of scope.
- **Frontend:** variant selection stays with `RequestStore`'s permission resolvers (`RequestPermissionResolvers.js`) over the existing `GET.collection` `regular` / `private` entries in `frontend/assets/js/utils/requests/config/commonItemConfig.js`; the filters are only query params appended to whichever variant is picked. No config change, no direct `AccessStore` call.

### Out of scope

Ordering by price, multi-select category, detail-page filters, other resources' filter bars.

## Benefits

- #1770 and #1771 become mechanical: both implement against one written contract, with no product decisions left in their PRs.
- The backend and frontend agree on edge cases (blank fields, unknown category, price parsing) by construction.
- The rationale is kept, ready to be moved into the permanent access-control doc when #1772 removes the specs.
