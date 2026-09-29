# Request wiring and permissions
Add the `recipe` RequestStore resource and the recipe permission lookups everything else builds
on.

- `utils/requests/config/recipeConfig.js` (new), modeled on `commonItemConfig.js`:
  - `GET.collection`: `regular` `/games/:gameSlug/recipes.json` (`permission: null`), `private`
    `/games/:gameSlug/recipes/all.json` (`permission: 'can_edit'`, `skipCache`).
  - `GET.single`: `/games/:gameSlug/recipes/:id.json` / `.../:id/full.json` (same split).
  - `GET.commonItemCollection`: `/games/:gameSlug/common_items/:commonItemId/recipes.json` /
    `.../recipes/all.json` (same split).
  - `POST.collection` and `PATCH.single`: unbranched (`regular` === `private`),
    `permission: 'can_edit'`, like `commonItemConfig.js`.
  - No `characters` quantity type (#1450).
- Register it as `recipe` in `utils/requests/resourceConfig.js` (`RESOURCES`).
- `utils/requests/RequestPermissionResolvers.js`: a `recipe` entry with `collection`, `single`
  and `commonItemCollection`, all `({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug)`
  (game-level GameEdit, deliberately **not** `/permissions/game_recipe.json`); add `'recipe'` to
  the JSDoc resource list.
- Recipe edit permission (`/permissions/game_recipe.json`, gates only the Edit link), mirroring
  `ensureCommonItemPermissions` end to end:
  - the game API client (`fetchCommonItemPermissions`'s sibling) → `fetchRecipePermissions`;
  - `utils/access/store/AccessStoreKeys.js` → `recipePermissions(gameSlug, roleSet)`;
  - `utils/access/store/AccessStorePermissions.js` → `ensureRecipePermissions`;
  - `utils/access/store/AccessStore.js` → `static ensureRecipePermissions(gameSlug)`.
- `can_create_recipe` already arrives in the game permissions payload
  (`ensureGamePermissions`); no store change is needed beyond documenting it where
  `can_create_common_item` is documented.

## Files to Change
- `utils/requests/config/recipeConfig.js` — new.
- `utils/requests/resourceConfig.js` — register `recipe`.
- `utils/requests/RequestPermissionResolvers.js` — `recipe` resolvers.
- game API client (file defining `fetchCommonItemPermissions`) — `fetchRecipePermissions`.
- `utils/access/store/AccessStoreKeys.js`, `AccessStorePermissions.js`, `AccessStore.js` —
  `ensureRecipePermissions`.
- Matching specs under `frontend/spec/...`.
