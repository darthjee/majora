import AccessStore from '../../../../utils/access/store/AccessStore.js';
import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import GameRecipeListItem from '../GameRecipeListItem.js';
import { buildReadOnlyActionBarProps, buildItemInfoBarItems } from '../listTypeConfig.js';

/**
 * Build a `fetchList` for a character-scoped recipes list (PC or NPC) through `RequestStore`
 * (`characterRecipe.collection`), resolving the requester's character-level edit permission to
 * pick between the hidden-inclusive `recipes/all.json` and the player-facing `recipes.json` —
 * mirrors `documentListTypes.js`'s `buildFetchCharacterDocuments`. The character id is read from
 * the current hash, since `ListPageController` only threads a `gameSlug` through to `fetchList`.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `fetchList(gameSlug, hashResolver)` function for this kind.
 */
function buildFetchCharacterRecipes(characterKind) {
  return function fetchCharacterRecipes(gameSlug, hashResolver) {
    const { character_id: characterId } = hashResolver.getParams(
      `/games/:game_slug/${characterKind}/:character_id/recipes`,
    );

    return fetchRequestStoreList({
      componentName: 'ListPageController',
      resource: 'characterRecipe',
      params: { gameSlug, kind: characterKind, id: characterId },
      query: buildListQuery(hashResolver),
      canEdit: AccessStore.ensureCharacterPermissions(characterKind, gameSlug, characterId),
    });
  };
}

/**
 * Build a `buildItemHref(item, context)` function for a character-scoped recipes list, linking
 * to the `CharacterRecipe` detail page (`item.data.id` is the row id). Needs
 * `context.characterId`, threaded in by `CharacterRecipesHelper`.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `buildItemHref(item, context)` function for this character kind.
 */
function buildCharacterRecipeItemHref(characterKind) {
  return function buildHref(item, context) {
    return `#/games/${context.gameSlug}/${characterKind}/${context.characterId}/recipes/${item.data.id}`;
  };
}

/**
 * Build one character-scoped recipes list-type entry.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
 * @returns {object} The `listTypeConfig` entry.
 */
function buildCharacterRecipeListType(characterKind) {
  return {
    fetchList: buildFetchCharacterRecipes(characterKind),
    // A `CharacterRecipe` entry carries the same `name`/`output`/`yield_quantity`/`hidden` shape
    // as a `GameRecipe` one, so #1449's wrapper is reused as-is.
    wrapperClass: GameRecipeListItem,
    filtersComponent: null,
    photoType: 'recipe',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('character_recipes_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildCharacterRecipeItemHref(characterKind),
    itemsPerRow: 6,
  };
}

/**
 * `listTypeConfig` entries for the character-scoped recipes lists (`'pc-recipes'`/
 * `'npc-recipes'`, issue #1450), kept apart from #1449's game-level `recipeListType.js`.
 */
const characterRecipeListTypes = {
  'pc-recipes': buildCharacterRecipeListType('pcs'),
  'npc-recipes': buildCharacterRecipeListType('npcs'),
};

export default characterRecipeListTypes;
