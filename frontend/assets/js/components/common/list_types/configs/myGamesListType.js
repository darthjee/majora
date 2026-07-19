import GenericClient from '../../../../client/GenericClient.js';
import MyGameListItem from '../MyGameListItem.js';
import MyGamesInfoBarRules from '../helpers/MyGamesInfoBarRules.js';

/**
 * Fetch the current user's games list (one entry per game they have a `Player` row in), backed
 * by the authenticated, unpaginated `/my-games.json` endpoint. Like the top-level games list,
 * this one has no game/character scope, no permission split, and no filters.
 *
 * @param {string} gameSlug - Unused for this list type, kept for a uniform `fetchList` signature
 *   across list types.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Unused for this list type, kept for a uniform `fetchList` signature across list types.
 * @param {GenericClient} [client] - HTTP client override, mainly for tests.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched entries and pagination metadata; `canEdit` is always `false`, since this list has no
 *   per-item manage affordance.
 */
function fetchMyGames(gameSlug, hashResolver, client = new GenericClient()) {
  return client.fetchIndex('/my-games.json').then(({ data, pagination }) => ({
    data: Array.isArray(data) ? data : [],
    pagination,
    canEdit: false,
  }));
}

/**
 * Build a my-game entry's action-bar props: always non-manageable, since a user's games have no
 * upload/edit affordance on this list page.
 *
 * @returns {{canEdit: boolean, secondaryButtons: object[]}} Action-bar props for `ActionsOverlay`.
 */
function buildReadOnlyActionBarProps() {
  return { canEdit: false, secondaryButtons: [] };
}

/**
 * Build a my-game entry's info-bar items (role, character, following-count, and unread-count
 * badges), delegating to `MyGamesInfoBarRules` so the badge shapes aren't duplicated here.
 *
 * @param {import('../MyGameListItem.js').default} item - Wrapped my-game list item.
 * @returns {{key: string, label: React.ReactElement}[]} Info-bar item definitions.
 */
function buildInfoBarItems(item) {
  return MyGamesInfoBarRules.build(item.data);
}

/**
 * Build a my-game entry's click-through href, to its game detail page.
 *
 * @param {import('../MyGameListItem.js').default} item - Wrapped my-game list item.
 * @returns {string} Hash path to the game detail page.
 */
function buildItemHref(item) {
  return `#/games/${item.data.game.game_slug}`;
}

/**
 * `listTypeConfig` entry for the current user's games list (`'my-games'`).
 */
const myGamesListType = {
  fetchList: fetchMyGames,
  wrapperClass: MyGameListItem,
  filtersComponent: null,
  photoType: 'photo',
  buildActionBarProps: buildReadOnlyActionBarProps,
  buildInfoBarItems,
  showCaption: true,
  buildItemHref,
  itemsPerRow: 4,
};

export default myGamesListType;
