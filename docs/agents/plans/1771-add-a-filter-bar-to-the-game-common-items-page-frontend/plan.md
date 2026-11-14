# Plan: Add a filter bar to the game common items page (frontend)

Issue: [1771-add-a-filter-bar-to-the-game-common-items-page-frontend.md](../../issues/1771-add-a-filter-bar-to-the-game-common-items-page-frontend.md)

## Overview

Add a treasure-style draft filter bar (name, category, min price, max price, Query/Clear) to the
game common items page, registered as the `commonItems` list type's `filtersComponent`. The
list fetch forwards the hash filter params, and the page keeps `activeFilters` and the hash in
sync, exactly like `GameTreasures`. Variant selection (`common_items.json` vs
`common_items/all.json`) is untouched. Specs:
`docs/agents/specs/common-items-filters.md` (+ `frontend.md`, `api-contract.md`, `testing.md`).

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Translation keys (translator writes, frontend reads)

New keys in `frontend/assets/i18n/<lang>/game_common_items_page.yaml` (`en` and `pt`):

| Key | en |
|-----|----|
| `game_common_items_page.filter_name_label` | Name |
| `game_common_items_page.filter_name_placeholder` | Search by name... |
| `game_common_items_page.filter_category_label` | Category |
| `game_common_items_page.filter_category_all` | All |
| `game_common_items_page.filter_min_price_label` | Min price |
| `game_common_items_page.filter_max_price_label` | Max price |

Category option labels **reuse** the existing `common_item_page.category.<value>` keys; no new
key per category.

### Category values

The dropdown options come from `CATEGORY_VALUES` in
`frontend/assets/js/components/resources/common_item/pages/elements/show/CommonItemCategoryField.jsx`
(already shared with `RecipeFiltersHelper`). It mirrors `GameCommonItem.CATEGORY_CHOICES`,
which has **8** values (`potion`, `drug`, `consumable`, `ammunition`, `poison`, `gear`,
`ingredient`, `other`).

### Query params sent (API contract)

`name` (trimmed), `category`, `min_price`, `max_price`. Blank fields are omitted; "all"
(blank) category is omitted.

## Spec correction (architect, same PR)

The specs and the issue say "7 categories". `ingredient` was added in #1752 before the specs
were written, so `GameCommonItem.CATEGORY_CHOICES` has 8. Per the specs' lifecycle rule, update
`docs/agents/specs/common-items-filters.md`, `common-items-filters/api-contract.md` and
`common-items-filters/testing.md` ("7" → "8", add `ingredient` to the lists) in this PR.
