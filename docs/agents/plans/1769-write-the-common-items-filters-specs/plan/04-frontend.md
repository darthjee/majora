# Frontend page

Create `docs/agents/specs/common-items-filters/frontend.md`, recording the issue's *Frontend interaction model* and the frontend half of *Permissions*:

- **Interaction model:** Treasure-style draft form (name, category dropdown "all" + 7 choices, min price, max price, then `common/forms/FilterActions.jsx` Query / Clear). Nothing is sent until Query; Enter in a text field triggers Query. Note the rejected alternatives (apply on change, mixed) and why.
- **Structure:** element + controller + helper, mirroring `frontend/assets/js/components/resources/treasure/pages/elements/TreasureFilters.jsx` and its controller/helper, under `frontend/assets/js/components/resources/common_item/pages/elements/`; uses `utils/filters/buildFilterQuery.js`.
- **Query building:** `name` trimmed; blank fields omitted; "all" means no `category` param.
- **Hash state and paging:** fields pre-filled from `HashRouteResolver().getFilterParams()`; the page passes `activeFilters` to the list like `GameTreasures` / `GameRecipes`; Query resets to page 1; Clear empties fields and hash filters and returns to page 1.
- **Inputs:** price inputs `type="number"`, `min="0"`, `step="1"` (hints only; backend rules apply).
- **Translations:** category option labels in every language under `frontend/assets/i18n/`, values stay the API keys; reuse existing category labels from the common item edit form if present.
- **Variant selection:** unchanged: `RequestStore`'s permission resolvers (`RequestPermissionResolvers.js`) over the existing `GET.collection` `regular` / `private` entries in `frontend/assets/js/utils/requests/config/commonItemConfig.js`; no config change, no direct `AccessStore` call. Same bar for everyone.

## Files to Change

- `docs/agents/specs/common-items-filters/frontend.md`: new page.
