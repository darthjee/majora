# Jasmine specs

Per `docs/agents/specs/common-items-filters/testing.md`, mirroring the treasure filter specs
(`specs/assets/js/components/resources/treasure/pages/elements/**/TreasureFilters*Spec.js`):

- **Element** `CommonItemFiltersSpec.js`: renders the four fields and the actions; pre-fills
  each field from the hash filters; Query calls `onQuery` with the built query (once, also via
  Enter); Clear resets the fields and calls `onClear`.
- **Controller** `CommonItemFiltersControllerSpec.js`: `name` trimmed, blank fields omitted,
  blank ("all") category omitted, `0` price kept; `clear()` resets all setters; change handlers.
- **Helper** `CommonItemFiltersHelperSpec.js`: labels, the blank "all" option plus every
  `CATEGORY_VALUES` option (8), number inputs with `min="0"` / `step="1"`.
- **List type**: `fetchGameCommonItems` forwards the hash filter params in the query and still
  goes through `fetchRequestStoreList`; `commonItems.filtersComponent` is `CommonItemFilters`.
- **Page wiring** (`GameCommonItemsSpec.js`, `GameCommonItemsHelperSpec.js` if present):
  `activeFilters` passed to `ListPage`; Query sets the filtered hash on page 1; Clear sets the
  hash to `basePath`.

## Files to Change

- `frontend/specs/assets/js/components/resources/common_item/pages/elements/CommonItemFiltersSpec.js`: new.
- `frontend/specs/assets/js/components/resources/common_item/pages/elements/controllers/CommonItemFiltersControllerSpec.js`: new.
- `frontend/specs/assets/js/components/resources/common_item/pages/elements/helpers/CommonItemFiltersHelperSpec.js`: new.
- `frontend/specs/assets/js/components/common/list_types/configs/commonItemListTypeSpec.js` (or wherever the existing list type spec lives): filter forwarding.
- `frontend/specs/assets/js/components/resources/common_item/pages/GameCommonItemsSpec.js` and its helper spec: page wiring.
