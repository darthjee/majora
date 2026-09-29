# Nav entry and routes
Expose the recipe pages in the header and the hash router.

- `components/common/header/helpers/HeaderNavHelper.jsx`: add
  `gameItem('recipes', '/recipes', 'game_page.recipes')` to `NAV_LINK_REGISTRY` (default
  `IS_GAME_PAGE` rule) and place it right after `common-items` in `NAV_LINK_GROUPS`.
- `utils/routing/HashRouteResolver.js` (`ROUTES`), specific paths before `:id`, next to the
  common-item routes:
  - `['/games/:game_slug/recipes/new', 'gameRecipeNew']`
  - `['/games/:game_slug/recipes/:id/edit', 'gameRecipeEdit']`
  - `['/games/:game_slug/recipes/:id', 'gameRecipe']`
  - `['/games/:game_slug/recipes', 'gameRecipes']`
- `components/helpers/AppHelper.jsx` (`PAGES`): map the four keys to `GameRecipes`,
  `GameRecipe`, `GameRecipeNew`, `GameRecipeEdit` (created in steps 03–05; stub them here if
  needed so each step stays green).
- No `accessRouteConfig.js` entry (common items have none). `category` is already in
  `FILTER_KEYS`.

## Files to Change
- `components/common/header/helpers/HeaderNavHelper.jsx` — nav entry.
- `utils/routing/HashRouteResolver.js` — four routes.
- `components/helpers/AppHelper.jsx` — page mapping.
- Matching specs (header nav, route resolution, app page mapping).
