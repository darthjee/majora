# Recipe new / edit pages
`#/games/:game_slug/recipes/new` and `.../:id/edit`, modeled on `GameCommonItemNew.jsx` /
`GameCommonItemEdit.jsx` (minus photos), using the `New` / `Edit` variants of `recipeShowType`.

- `GameRecipeNew.jsx` + `controllers/GameRecipeNewController.js` +
  `helpers/GameRecipeNewHelper.jsx`: redirects to the list when `!permissions.can_create_recipe`
  (like `GameCommonItemNewController`).
- `GameRecipeEdit.jsx` + `controllers/GameRecipeEditController.js` +
  `helpers/RecipeEditHelper.jsx` (+ a `useApplyLoadedRecipe` hook if the common-item one is
  mirrored): loads `recipe.single`, pre-fills the form.
- Field editors (New/Edit variants in `elements/show/`):
  | Field | Editor |
  |---|---|
  | `name` | text input like `CommonItemNameField` (required, ≤200) |
  | `game_common_item_id` | `RecipeOutputField` → `SingleResourcePickerField` in API mode, `picker={{resource: 'commonItem', maxEntries: 5, params: {gameSlug}}}`, value `{id, name}`; required on create. Precedent: `buildSessionPicker` in `components/resources/game/pages/taskSessions.js` |
  | `yield_quantity` | integer input, min 1, default 1 |
  | `crafting_time` | text input, ≤200, optional |
  | `crafting_cost` | `TreasureMoney` + button opening `<MoneyEditModal context="treasure"/>`, like `CommonItemPriceField.jsx` / `GameCommonItemEditModals.jsx`; default 0 |
  | `description`, `ingredients`, `checks` | `MarkdownEditor`, like `CommonItemDescriptionField.jsx` |
  | `hidden` | switch like `CommonItemHiddenField` (shown to every editor) |
- **Masked output on edit:** when the loaded recipe has `output: null`, the picker shows the
  "unknown" placeholder; `game_common_item_id` is only sent if the user picks a new output.
- **Submit:** `RequestStore.mutate` POST `recipe.collection` / PATCH `recipe.single`, body limited
  to the write fields above, then `RequestStore.purge({resource: 'recipe'})` (this also clears
  the cached common-item shortlists, which are `recipe.commonItemCollection`). Redirect to the
  show page on success.
- **Errors:** a `400` on `game_common_item_id` shows `recipe_{new,edit}_page.errors.invalid_output`
  under the picker; other `400` field errors show under their fields (same mechanism as the
  common-item forms).
- **Hiding as a regular-tier caller:** if the caller lacks game-level `can_edit` and saves with
  `hidden: true`, redirect to the list instead of the show page and show
  `recipe_{new,edit}_page.hidden_notice` (the recipe becomes unreachable to them).

## Files to Change
- `components/resources/recipe/pages/GameRecipeNew.jsx`, `GameRecipeEdit.jsx` — new.
- `components/resources/recipe/pages/controllers/GameRecipeNewController.js`,
  `GameRecipeEditController.js` — new.
- `components/resources/recipe/pages/helpers/GameRecipeNewHelper.jsx`, `RecipeEditHelper.jsx` — new.
- `components/resources/recipe/pages/elements/show/*.jsx` — New/Edit variants
  (`RecipeNameField`, `RecipeOutputField`, `RecipeYieldField`, `RecipeCraftingTimeField`,
  `RecipeCraftingCostField`, `RecipeMarkdownField`, `RecipeHiddenField`, `RecipeTitle`,
  `RecipeSubmitButton`) and `elements/RecipeEditModals.jsx` for the money modal.
- `components/common/show_page/show_types/configs/recipeShowType.js` — wire New/Edit variants.
- Matching specs.
