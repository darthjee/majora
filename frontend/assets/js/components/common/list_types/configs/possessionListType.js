import AccessStore from '../../../../utils/access/store/AccessStore.js';
import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import GamePossessionListItem from '../GamePossessionListItem.js';
import { buildReadOnlyActionBarProps, buildItemInfoBarItems } from '../listTypeConfig.js';

/**
 * Fetch a page of a game's possessions through `RequestStore` (`possession.collection`),
 * resolving the requester's edit permission first to pick between the full catalog
 * (`possessions/all.json`, dm/admin only) and the player-facing, hidden-filtered
 * `possessions.json` — mirroring `listTypeConfig.js`'s own `fetchGameItems` exactly, minus the
 * `kind` param (`possession` has no PC/NPC-owned counterpart, unlike `item`).
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read pagination params from the current hash.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched possessions, pagination metadata, and the resolved edit permission.
 */
function fetchGamePossessions(gameSlug, hashResolver) {
  return fetchRequestStoreList({
    componentName: 'ListPageController',
    resource: 'possession',
    params: { gameSlug },
    query: buildListQuery(hashResolver),
    canEdit: AccessStore.ensureGamePermissions(gameSlug),
  });
}

/**
 * Build a game possession's click-through href, to its game-scoped detail page (issue #1074).
 *
 * @param {import('../GamePossessionListItem.js').default} item - Wrapped game possession list item.
 * @param {{gameSlug: string}} context - Rendering context, supplying the game slug.
 * @returns {string} Hash path to the possession's detail page.
 */
function buildGamePossessionHref(item, context) {
  return `#/games/${context.gameSlug}/possessions/${item.data.id}`;
}

/**
 * `listTypeConfig` entry for a game's possessions list (`'possessions'`, issue #1074), mirroring
 * `listTypeConfig.js`'s own `items` entry — game-level only, no PC/NPC-owned counterpart, no
 * filters, and no per-item manage affordance (possession creation is the only gated action, on
 * the page header itself, not per-row).
 */
const possessionListType = {
  fetchList: fetchGamePossessions,
  wrapperClass: GamePossessionListItem,
  filtersComponent: null,
  photoType: 'possession',
  buildActionBarProps: buildReadOnlyActionBarProps,
  buildInfoBarItems: buildItemInfoBarItems('game_possessions_page.hidden_label'),
  showCaption: true,
  buildItemHref: buildGamePossessionHref,
  itemsPerRow: 6,
};

export default possessionListType;
