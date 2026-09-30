import AccessStore from '../../../../utils/access/store/AccessStore.js';
import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import GameRecipeListItem from '../GameRecipeListItem.js';
import RecipeFilters from '../../../resources/recipe/pages/elements/RecipeFilters.jsx';
import RecipeFiltersController
  from '../../../resources/recipe/pages/elements/controllers/RecipeFiltersController.js';
import { buildReadOnlyActionBarProps, buildItemInfoBarItems } from '../listTypeConfig.js';

/**
 * Fetch a page of a game's recipes through `RequestStore` (`recipe.collection`), resolving the
 * requester's game-level edit permission first to pick between the full catalog
 * (`recipes/all.json`, GameEdit only) and the player-facing, hidden-filtered `recipes.json`.
 * The hash's `?category=` filter is forwarded as a query param when it is a valid
 * `GameCommonItem` category (see {@link RecipeFiltersController.categoryFromParams}).
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read pagination and filter params from the current hash.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched recipes, pagination metadata, and the resolved edit permission.
 */
function fetchGameRecipes(gameSlug, hashResolver) {
  const category = RecipeFiltersController.categoryFromParams(hashResolver.getFilterParams());

  return fetchRequestStoreList({
    componentName: 'ListPageController',
    resource: 'recipe',
    params: { gameSlug },
    query: buildListQuery(hashResolver, category ? { category } : {}),
    canEdit: AccessStore.ensureGamePermissions(gameSlug),
  });
}

/**
 * Build a game recipe's click-through href, to its game-scoped detail page.
 *
 * @param {GameRecipeListItem} item - Wrapped game recipe list item.
 * @param {{gameSlug: string}} context - Rendering context, supplying the game slug.
 * @returns {string} Hash path to the recipe's detail page.
 */
function buildGameRecipeHref(item, context) {
  return `#/games/${context.gameSlug}/recipes/${item.data.id}`;
}

/**
 * `listTypeConfig` entry for a game's recipes list (`'recipes'`, issue #1449), mirroring
 * `commonItemListType.js`, plus the category filter bar.
 */
const recipeListTypes = {
  recipes: {
    fetchList: fetchGameRecipes,
    wrapperClass: GameRecipeListItem,
    filtersComponent: RecipeFilters,
    photoType: 'recipe',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('game_recipes_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildGameRecipeHref,
    itemsPerRow: 6,
  },
};

export default recipeListTypes;
