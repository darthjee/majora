# Exchange modal (acquire / remove)

Tabs for `ResourceExchangeModal`, modeled on `documentExchangeTabs.js`, `AcquireDocumentTab.jsx`
and `RemoveDocumentTab.jsx` (with their controllers and helpers), on top of
`tabs/shared/ExchangeDetailPane.jsx`.

- **`elements/recipeExchangeTabs.js`**: `acquire` / `remove` entries with
  `recipe_exchange_modal.{acquire,remove}_tab[_tooltip]` labels.
- **`tabs/AcquireRecipeTab.jsx` + `controllers/AcquireRecipeTabController.js` +
  `helpers/AcquireRecipeTabHelper.jsx`**: browse `characterRecipe.availableCollection` (`?name=`
  search, 300 ms debounce, `per_page` 10). The game-level resolver picks `available/all.json` for
  GameEdit. POST `characterRecipe.acquire` with
  `variantName: character.gameCanEdit ? 'private' : 'regular'` and body `{ game_recipe_id }` only.
  **No hidden switch**, unlike documents: the row copies `GameRecipe.hidden`, and the GM toggles
  it later on the detail page. Show the recipe card (`CardRecipeImage` / `RecipePreviewCard`) in
  the list and detail pane.
- **`tabs/RemoveRecipeTab.jsx` + controller + helper**: browse the character's own
  `characterRecipe.collection` (`?name=`). POST `characterRecipe.remove` with
  `variantName: character.canEdit ? 'private' : 'regular'` and body `{ game_recipe_id }` (the
  entry's `game_recipe_id`, **not** its row `id`).
- **Errors** (`ERROR_KEY_BY_MESSAGE`-style mapping, as in the document tabs): `422` →
  `recipe_exchange_modal.already_owned_error`, `404` → `recipe_exchange_modal.not_found_error`,
  otherwise → `recipe_exchange_modal.generic_error`.
- **Success** (`201` / `204`): `RequestStore.purge` both `characterRecipe` and `recipe` (the
  "Known by" list changes too), then call `onSuccess` so `CharacterRecipes.jsx` bumps its
  `refreshToken`.

## Files to Change
- `frontend/assets/js/components/resources/character/pages/elements/recipeExchangeTabs.js` — new.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/AcquireRecipeTab.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/RemoveRecipeTab.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireRecipeTabController.js` — new.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveRecipeTabController.js` — new.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/AcquireRecipeTabHelper.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/RemoveRecipeTabHelper.jsx` — new.
- Matching specs (variant per caller, request bodies, error mapping, purge on success).
