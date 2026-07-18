import GenericClient from '../../../../client/GenericClient.js';
import GameListItem from '../GameListItem.js';

/**
 * Fetch a page of the top-level games list. Unlike every other list type, this one has no
 * game/character scope, no permission split (every viewer already sees the same list), and no
 * filters — matching today's `GamesController`.
 *
 * @param {string} gameSlug - Unused for this list type, kept for a uniform `fetchList` signature
 *   across list types.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Unused for this list type, kept for a uniform `fetchList` signature across list types.
 * @param {GenericClient} [client] - HTTP client override, mainly for tests.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched games and pagination metadata; `canEdit` is always `false`, since this list has no
 *   per-item manage affordance.
 */
function fetchGames(gameSlug, hashResolver, client = new GenericClient()) {
  return client.fetchIndex('/games.json').then(({ data, pagination }) => ({
    data: Array.isArray(data) ? data : [],
    pagination,
    canEdit: false,
  }));
}

/**
 * Build a game's action-bar props: always non-manageable, since games have no upload/edit
 * affordance on this list page.
 *
 * @returns {{canEdit: boolean, secondaryButtons: object[]}} Action-bar props for `ActionsOverlay`.
 */
function buildReadOnlyActionBarProps() {
  return { canEdit: false, secondaryButtons: [] };
}

/**
 * Build a game's info-bar items: always empty, since games have no status/hidden concept on
 * this list page.
 *
 * @returns {Array} Always an empty array.
 */
function buildEmptyInfoBarItems() {
  return [];
}

/**
 * Build a game's click-through href, to its detail page.
 *
 * @param {import('../GameListItem.js').default} item - Wrapped game list item.
 * @returns {string} Hash path to the game detail page.
 */
function buildItemHref(item) {
  return `#/games/${item.data.game_slug}`;
}

/**
 * `listTypeConfig` entry for the top-level games list (`'games'`).
 */
const gamesListType = {
  fetchList: fetchGames,
  wrapperClass: GameListItem,
  filtersComponent: null,
  photoType: 'photo',
  buildActionBarProps: buildReadOnlyActionBarProps,
  buildInfoBarItems: buildEmptyInfoBarItems,
  showCaption: true,
  buildItemHref,
  itemsPerRow: 4,
};

export default gamesListType;
