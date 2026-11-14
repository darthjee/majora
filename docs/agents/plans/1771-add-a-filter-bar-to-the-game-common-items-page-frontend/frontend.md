# Frontend Plan: Add a filter bar to the game common items page (frontend)

Main plan: [plan.md](plan.md)

## Shared contracts

- Reads the `game_common_items_page.filter_*` keys added by the translator (see
  [plan.md](plan.md#shared-contracts)) and the existing `common_item_page.category.<value>` keys.
- Category options come from `CATEGORY_VALUES` (8 values, including `ingredient`).
- Sends `name` (trimmed), `category`, `min_price`, `max_price`; blank / "all" omitted.

## Steps

- [01 — Filter element, controller and helper](frontend/01-common-item-filters-element.md)
- [02 — Forward filters in the list fetch and register the filters component](frontend/02-list-type-wiring.md)
- [03 — Page wiring with activeFilters and hash](frontend/03-page-wiring.md)
- [04 — Jasmine specs](frontend/04-specs.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (Jasmine)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI step: Check JS Lint)
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI step: Check translations)

## Notes

- Variant selection is unchanged: `fetchGameCommonItems` keeps going through
  `fetchRequestStoreList` / `RequestStore` and the permission resolvers; only the `query`
  gains the filter params. No change to `commonItemConfig.js`, no direct `AccessStore` call in
  the new code.
- Regular viewers and editors see the same filter bar.
- Neither precedent (`TreasureFilters`, `RecipeFilters`) handles Enter; this one must
  (`frontend.md`: "Enter in a text field triggers Query"). Make sure the Query button and the
  Enter path never fire `onQuery` twice.
