# Frontend

Part of the [Common Items Filters](../common-items-filters.md) specs (Epic #1766).

*Planned by #1771.* Nothing on this page exists yet. It records how the common items page
(`frontend/assets/js/components/resources/common_item/pages/GameCommonItems.jsx`) exposes the
filters from the [API contract](api-contract.md).

## Interaction model

A **treasure-style draft form**. Fields, in order:

1. name;
2. category dropdown: "all" plus the 7 choices;
3. min price;
4. max price;
5. `common/forms/FilterActions.jsx` (Query / Clear).

Nothing is sent until Query. Enter in a text field triggers Query.

Rejected alternatives:

- **Apply on change:** needs a debounce the project doesn't have, and fires extra requests while
  typing.
- **A mix of both:** two behaviours in one bar, and it is unclear what happens to typed but
  unsubmitted prices.

## Structure

Element + controller + helper, mirroring
`frontend/assets/js/components/resources/treasure/pages/elements/TreasureFilters.jsx` and its
controller and helper, under
`frontend/assets/js/components/resources/common_item/pages/elements/`. The query is built with
`utils/filters/buildFilterQuery.js`.

## Query building

- `name` is trimmed before sending (rule #15).
- Blank fields are omitted.
- "all" categories means `category` is not sent.

## Hash state and paging

- All four fields are pre-filled from `HashRouteResolver().getFilterParams()` on load.
- The page passes `activeFilters` to the list, like `GameTreasures` / `GameRecipes`, so filtered
  URLs are shareable.
- Query resets to page 1.
- Clear empties the fields and the hash filters, and returns to page 1.

## Inputs

Price inputs use `type="number"`, `min="0"` and `step="1"`, as hints only: the backend rules
(#5 to #8) still apply.

## Translations

- Category option labels are translated in every language under `frontend/assets/i18n/`; option
  values stay the API's lowercase keys.
- Reuse the existing category labels from the common item edit form, if present, before adding
  new keys.

## Variant selection

Unchanged. `RequestStore`'s permission resolvers
(`frontend/assets/js/utils/requests/RequestPermissionResolvers.js`) pick between the existing
`GET.collection` `regular` / `private` entries in
`frontend/assets/js/utils/requests/config/commonItemConfig.js`. The filters are only query params
appended to whichever variant is picked: no config change, no direct `AccessStore` call.

Regular viewers and editors see the **same filter bar**.
