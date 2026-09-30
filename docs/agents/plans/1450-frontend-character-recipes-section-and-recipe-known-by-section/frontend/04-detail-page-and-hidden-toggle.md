# Detail page and hidden toggle

`#/games/:game_slug/pcs|npcs/:character_id/recipes/:id`, modeled on `shared/CharacterDocument.jsx`
and `CharacterDocumentDetailController.js`, without photos or pages.

- **`PcCharacterRecipe.jsx` / `NpcCharacterRecipe.jsx`** → **`shared/CharacterRecipe.jsx`**:
  loading, error and not-found plumbing like `CharacterDocument.jsx`, plus a back link to the list
  (`character_recipe_page.back_link`).
- **`controllers/CharacterRecipeDetailController.js`**: `RequestStore.ensure({resource:
  'characterRecipe', quantityType: 'single', params: {gameSlug, kind, id: characterId,
  characterRecipeId}})`. The character-level resolver picks `full.json` for CharacterEdit (PC) or
  GameEdit (NPC). A `404` renders the standard not-found state.
- **`helpers/CharacterRecipeDetailHelper.jsx`**: renders the same fields as the game recipe show
  page by reusing #1449's display elements where their props allow it (`RecipeImage`,
  `RecipeNameHeading`, `RecipeOutputField`, `RecipeYieldField`, `RecipeCraftingTimeField`,
  `RecipeCraftingCostField`, the markdown `RecipeDescriptionField` / `RecipeIngredientsField` /
  `RecipeChecksField`). If those elements are coupled to the `recipe` show type's form state,
  render them through a small `characterRecipeShowType.js` (like `characterDocumentShowType.js`)
  with `Show` variants only. Also add a link to the game recipe
  `#/games/:slug/recipes/:game_recipe_id` (`character_recipe_page.game_recipe_link`). The link may
  `404` for non-editors when the GameRecipe is hidden; that's accepted.
- **Hidden toggle** (`elements/show/CharacterRecipeHiddenField.jsx`, like `ItemHiddenField.jsx`):
  only rendered when the entry came from `full.json` (i.e. `hidden` is present). Toggling calls
  `RequestStore.mutate({resource: 'characterRecipe', method: 'PATCH', quantityType: 'single',
  params, body: {hidden}})`, then `RequestStore.purge({resource: 'characterRecipe'})` and updates
  local state. Label: `character_recipe_page.hidden_toggle_label`.
- No edit route: `hidden` is the only writable field.

## Files to Change
- `frontend/assets/js/components/resources/character/pages/PcCharacterRecipe.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/NpcCharacterRecipe.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterRecipe.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterRecipeDetailController.js` — new.
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterRecipeDetailHelper.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterRecipeHiddenField.jsx` — new.
- `frontend/assets/js/components/common/show_page/show_types/configs/characterRecipeShowType.js` + `showTypeConfig.js` — only if the show-type route is taken.
- Matching specs (variant selection, masked output placeholder, toggle visibility and PATCH body, 404).
