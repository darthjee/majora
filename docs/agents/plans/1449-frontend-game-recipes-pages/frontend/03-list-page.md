# Recipes list page
`#/games/:game_slug/recipes`, modeled on `GameCommonItems.jsx` and `commonItemListType.js`.

- `components/resources/recipe/pages/GameRecipes.jsx` + `controllers/GameRecipesController.js`
  + `helpers/GameRecipesHelper.jsx`: `PageActions` + `<ListPage type="recipes"/>`; title
  `game_recipes_page.title`; "New" button (`game_recipes_page.new_button`) linking to
  `#/games/:slug/recipes/new`, gated on `can_create_recipe` from
  `AccessStore.ensureGamePermissions(gameSlug)` exactly like `GameCommonItemsController`.
- `components/common/list_types/configs/recipeListType.js` (new), registered in
  `listTypeConfig.js`: `fetchList` via `fetchRequestStoreList({resource: 'recipe', ...})` with
  `query: buildListQuery(hashResolver)` (so `?category=` is forwarded), `canEdit` from
  `ensureGamePermissions`; `wrapperClass: GameRecipeListItem`; `filtersComponent: RecipeFilters`;
  `photoType: 'recipe'`; `buildItemInfoBarItems('game_recipes_page.hidden_label')`;
  `buildItemHref` → `#/games/:slug/recipes/:id`; `showCaption: true`.
- `components/common/list_types/GameRecipeListItem.js` (new, extends `BaseListItem`): photo from
  `output.photo_path`; caption line `game_recipes_page.yield_format` with
  `output = output?.name ?? t('game_recipes_page.unknown_output')`, `yield = yield_quantity`;
  `hidden` getter like `GameCommonItemListItem`.
- `components/common/cards/CardRecipeImage.jsx` (new), registered as `recipe` in
  `PHOTO_COMPONENTS` (`components/common/misc/ActionsOverlay.jsx`, update its `type` JSDoc):
  renders `output.photo_path`, falls back to the existing common-item placeholder
  (`frontend/assets/images/placeholders/default_common_item.png`, as `CardCommonItemImage` does)
  when `output` is `null` or has no photo. No new image asset.
- Category filter, following the Tasks filter pattern
  (`components/resources/game/pages/elements/TaskFilters.jsx`, `helpers/TaskFiltersHelper.jsx`,
  `controllers/TaskFiltersController.js`): `elements/RecipeFilters.jsx` +
  `elements/helpers/RecipeFiltersHelper.jsx` + `controllers/RecipeFiltersController.js`,
  rendering a `FilterSelect` over the `GameCommonItem.category` choices (labels
  `common_item_page.category.<value>`, plus an "all" option `game_recipes_page.category_filter_all`);
  the hash `?category=` is validated against the choice list, and changing it resets to page 1 via
  `buildFilteredHref`. Masked recipes never match a category — no special handling.
- Empty state: `game_recipes_page.empty`.

## Files to Change
- `components/resources/recipe/pages/GameRecipes.jsx`, `controllers/GameRecipesController.js`,
  `helpers/GameRecipesHelper.jsx` — new.
- `components/resources/recipe/pages/elements/RecipeFilters.jsx`,
  `elements/helpers/RecipeFiltersHelper.jsx`, `controllers/RecipeFiltersController.js` — new.
- `components/common/list_types/configs/recipeListType.js`,
  `components/common/list_types/GameRecipeListItem.js` — new.
- `components/common/list_types/listTypeConfig.js` — register `recipeListType`.
- `components/common/cards/CardRecipeImage.jsx` — new.
- `components/common/misc/ActionsOverlay.jsx` — register `recipe` photo type.
- Matching specs.
