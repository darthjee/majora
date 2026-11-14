# Filter element, controller and helper

Create `CommonItemFilters`, mirroring `treasure/pages/elements/TreasureFilters.jsx`:

- **Element** `CommonItemFilters.jsx` (props `onQuery`, `onClear`): draft state for `name`,
  `category`, `minPrice`, `maxPrice`, each pre-filled from
  `new HashRouteResolver().getFilterParams()` (`name`, `category`, `min_price`,
  `max_price`, defaulting to `''`). Query calls `onQuery(controller.buildQuery(...))`; Clear
  calls `controller.clear()` then `onClear()`.
- **Controller** `controllers/CommonItemFiltersController.js`: one setter per field, change
  handlers, `buildQuery(name, category, minPrice, maxPrice)` via
  `utils/filters/buildFilterQuery.js` with entries `['name', name.trim()]`,
  `['category', category]`, `['min_price', minPrice]`, `['max_price', maxPrice]`, and
  `clear()` resetting all four to `''`.
- **Helper** `helpers/CommonItemFiltersHelper.jsx`: `data-testid="common-item-filters"` row,
  fields in this order:
  1. name text input (`common-item-filter-name`, label + placeholder keys);
  2. category: `common/forms/FilterSelect.jsx` (like `RecipeFiltersHelper`), blank option
     labelled `game_common_items_page.filter_category_all`, options from `CATEGORY_VALUES`
     labelled `common_item_page.category.<value>`;
  3. min price and 4. max price: `type="number"`, `min="0"`, `step="1"`;
  5. `FilterActions` with `testIdPrefix="common-item"`.
- **Enter triggers Query**: wrap the fields in a `<form>` whose `onSubmit` prevents the default
  and calls `onQuery` (or handle `keydown` Enter on the text/number inputs). Check whether
  `FilterActions`' Query button is `type="submit"`/`type="button"` so the click doesn't also
  submit the form and query twice.

## Files to Change

- `frontend/assets/js/components/resources/common_item/pages/elements/CommonItemFilters.jsx`: new element.
- `frontend/assets/js/components/resources/common_item/pages/elements/controllers/CommonItemFiltersController.js`: new controller.
- `frontend/assets/js/components/resources/common_item/pages/elements/helpers/CommonItemFiltersHelper.jsx`: new helper.
