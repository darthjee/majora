# Page wiring with activeFilters and hash

Mirror `treasure/pages/GameTreasures.jsx` / `GameTreasuresHelper.jsx`:

- `GameCommonItems.jsx`: compute
  `activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams())`, add a
  `refreshToken` state, and the handlers:
  - `onFilterQuery(filters)`: `window.location.hash = buildFilterQueryHash(basePath, filters)`
    (`utils/routing/buildFilteredHref.js`, which resets to page 1), then refresh;
  - `onFilterClear()`: `window.location.hash = basePath`, then refresh.
- `GameCommonItemsHelper.render(state, handlers)`: pass
  `filters={{ props: { onQuery, onClear }, active: state.activeFilters }}` and
  `refreshToken` to `ListPage`, so pagination links keep the filters.
- Keep the existing `canCreateCommonItem` behaviour untouched.

## Files to Change

- `frontend/assets/js/components/resources/common_item/pages/GameCommonItems.jsx`: activeFilters, refresh token, filter handlers.
- `frontend/assets/js/components/resources/common_item/pages/helpers/GameCommonItemsHelper.jsx`: forward filters and refresh token to `ListPage`; update JSDoc.
