# Recipe show page
`#/games/:game_slug/recipes/:id`, modeled on `GameCommonItem.jsx` (minus photo upload).

- `components/resources/recipe/pages/GameRecipe.jsx` + `controllers/GameRecipeController.js` +
  `helpers/RecipeDetailHelper.jsx`: fetch `recipe.single` through `RequestStore` (the resolver
  picks `/full.json` for GameEdit callers); `canEdit` from `AccessStore.ensureRecipePermissions`
  (fail-closed); Edit button → `#/games/:slug/recipes/:id/edit`; back link → the list. A `404`
  renders the standard not-found / error state, like the common item page. Render through
  `<ShowPageLayout type="recipe" mode="show" .../>`, passing `game_slug` in the context.
- `components/common/show_page/show_types/configs/recipeShowType.js` (new), registered as
  `recipe` in `showTypeConfig.js`, with `{Show, New, Edit}` variants per slot (New/Edit
  components come from step 05):
  - `left`: `RecipeImage` (the `CardRecipeImage` output photo / placeholder), `{Show: RecipeNameHeading}`,
    `{Edit: RecipeHiddenField}`.
  - `right`: title (New/Edit), name field (New/Edit), `RecipeOutputField` (Show: link to
    `#/games/:slug/common_items/:output.id` with the output name, or `recipe_page.unknown_output`
    when `output` is `null`), `RecipeYieldField`, `RecipeCraftingTimeField` (omitted in Show
    when blank), `RecipeCraftingCostField` (Show: `<TreasureMoney value={crafting_cost}/>`),
    markdown sections `description` / `ingredients` / `checks` (Show: `DescriptionBox` each with its
    own heading `recipe_page.*_title`, omitted when empty), hidden badge
    (`recipe_page.hidden_label`, Show only, when `hidden` is present and true), `{New: hidden}`,
    submit (New/Edit).
  - `bottom: []`. No "Known by" slot (#1450).
- Field components go in `components/resources/recipe/pages/elements/show/` (one per field,
  named like the `CommonItem*Field.jsx` set).

## Files to Change
- `components/resources/recipe/pages/GameRecipe.jsx`, `controllers/GameRecipeController.js`,
  `helpers/RecipeDetailHelper.jsx` — new.
- `components/resources/recipe/pages/elements/show/*.jsx` — Show variants of the field
  components.
- `components/common/show_page/show_types/configs/recipeShowType.js` — new.
- `components/common/show_page/show_types/showTypeConfig.js` — register `recipe`.
- Matching specs.
