# Request wiring and permissions

Add the `characterRecipe` request resource and the missing `recipe.characters` quantity type, plus
the `can_exchange_recipe` permission flag. Every later step depends on this one.

- **`utils/requests/config/characterRecipeConfig.js`** (new, modeled on the character-owned half
  of `documentConfig.js`). Params `{gameSlug, kind, id, characterRecipeId}`:
  - GET `collection`: regular `/:kind/:id/recipes.json`, private `.../recipes/all.json`
    (`permission: 'can_edit'`, `skipCache: true`).
  - GET `single`: regular `.../recipes/:characterRecipeId.json`, private
    `.../recipes/:characterRecipeId/full.json` (`can_edit`, `skipCache`).
  - GET `availableCollection`: regular `.../recipes/available.json` (`skipCache`), private
    `.../recipes/available/all.json` (`can_edit`, `skipCache`).
  - POST `acquire` / `remove`: regular `.../acquire.json` / `.../remove.json`, private
    `.../acquire/all.json` / `.../remove/all.json` (mutations pass an explicit `variantName`).
  - PATCH `single`: `.../recipes/:characterRecipeId.json` for both variants.
  - Paths are all under `/games/:gameSlug`.
- **`utils/requests/config/recipeConfig.js`**: add GET `characters`, with regular
  `/games/:gameSlug/recipes/:id/characters.json` and private `.../characters/all.json`
  (`can_edit`, `skipCache`). Update the header comment, which currently says `characters` is
  left to #1450.
- **`utils/requests/resourceConfig.js`**: register `characterRecipe` in `RESOURCES` and update the
  resource-name JSDoc list.
- **`utils/requests/RequestPermissionResolvers.js`**:
  - `characterRecipe.collection` / `.single` →
    `AccessStore.ensureCharacterPermissions(kind, gameSlug, id)` (like `document.collection`).
  - `characterRecipe.availableCollection` → `AccessStore.ensureGamePermissions(gameSlug)` (like
    `document.availableCollection`, so an owning player never sees the hidden catalog).
  - `recipe.characters` → `AccessStore.ensureGamePermissions(gameSlug)`.
- **Permissions**: add `can_exchange_recipe` to `utils/access/store/AccessStorePermissions.js`
  (parse/default and the JSDoc payload shapes, next to `can_exchange_treasure`). Merge it as
  `Boolean(permissions.can_exchange_recipe)` in
  `components/resources/character/pages/controllers/CharacterAccessResolver.js`.

## Files to Change
- `frontend/assets/js/utils/requests/config/characterRecipeConfig.js` — new resource config.
- `frontend/assets/js/utils/requests/config/recipeConfig.js` — `characters` quantity type.
- `frontend/assets/js/utils/requests/resourceConfig.js` — register `characterRecipe`.
- `frontend/assets/js/utils/requests/RequestPermissionResolvers.js` — new resolvers.
- `frontend/assets/js/utils/access/store/AccessStorePermissions.js` — `can_exchange_recipe`.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterAccessResolver.js` — merge `can_exchange_recipe`.
- Matching specs under `frontend/spec/` (config paths per variant, resolver scopes, permission merge).
