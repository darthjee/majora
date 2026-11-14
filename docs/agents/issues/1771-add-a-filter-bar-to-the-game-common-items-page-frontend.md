# Issue: Add a filter bar to the game common items page (frontend)

## Description
Part of Epic #1766. Add a filter bar (name, category, min price, max price) to the game common items page (`frontend/assets/js/components/resources/common_item/pages/GameCommonItems.jsx`).

Depends on the backend sub-issue #1770 (category and price-range filters on both common items indexes), now closed.

**Follow `docs/agents/specs/common-items-filters.md` and its `frontend.md`, `api-contract.md` and `testing.md` pages**; where this issue and the specs disagree, the specs win. If the implementation has to deviate, update the relevant spec page in the same PR.

## Problem
The common items page lists a game's common items but has no filter UI, not even for the existing `?name=` filter. The backend index now accepts `name`, `category` (7 fixed choices: `potion`, `drug`, `consumable`, `ammunition`, `poison`, `gear`, `other`), `min_price` and `max_price` on both `common_items.json` and `common_items/all.json`.

## Expected Behavior
- The page shows a filter bar above the list with, in order: name, category dropdown ("all" + the 7 choices), min price, max price, and `common/forms/FilterActions.jsx` (Query / Clear).
- **Treasure-style draft form:** nothing is sent until Query; Enter in a text field triggers Query.
- Query building: `name` is trimmed, blank fields are omitted, "all" category means `category` is not sent.
- All four fields are pre-filled from `HashRouteResolver().getFilterParams()` on load; the page passes `activeFilters` to the list, so filtered URLs are shareable.
- Query resets to page 1; Clear empties the fields and the hash filters and returns to page 1.
- Price inputs use `type="number"`, `min="0"`, `step="1"` (hints only; backend rules #5–#8 still apply).
- Regular viewers and editors see the same filter bar; editors still see hidden items.

## Solution
1. Add a `CommonItemFilters` element with its controller and helper under `frontend/assets/js/components/resources/common_item/pages/elements/` (and the matching `controllers/` / `helpers/` folders), mirroring `treasure/pages/elements/TreasureFilters.jsx`. Build the query with `utils/filters/buildFilterQuery.js`.
2. Wire it into `GameCommonItems.jsx` with `activeFilters`, like `GameTreasures` / `GameRecipes`.
3. Variant selection is unchanged: `RequestStore`'s permission resolvers (`utils/requests/RequestPermissionResolvers.js`) keep choosing between the `regular` / `private` entries in `utils/requests/config/commonItemConfig.js`. Filters are only query params appended to the variant that is picked. No config change and no direct `AccessStore` call.
4. Translations (translator): reuse the existing category labels in `frontend/assets/i18n/*/common_item_page.yaml` for the option labels (option values stay the API's lowercase keys); add new keys only for the new field labels, in every language.
5. Jasmine specs under `frontend/specs/` per `testing.md`:
   - element: renders the four fields and the actions, pre-filled from the hash filters;
   - controller: `name` trimmed, blank fields omitted, "all" category omitted;
   - helper: fields and labels, including the 7 category options;
   - page wiring: `activeFilters` passed to the list; Query and Clear reset to page 1; Clear empties the hash filters;
   - translations: keys in sync across languages.

### Acceptance criteria
- [ ] The common items page shows a filter bar with name, category, min price and max price
- [ ] Nothing is requested until Query (or Enter); Query resets to page 1
- [ ] Filters are reflected in and restored from the URL hash
- [ ] Clear resets all fields, the hash filters and the list
- [ ] Variant selection still goes through the permission resolvers; editors still see hidden items
- [ ] Translations present for all supported languages
- [ ] Specs and ESLint pass

## Benefits
Users can find common items by name, category and price range, and can share or bookmark filtered views through the URL.
