import AccessStore from '../../../../utils/access/store/AccessStore.js';
import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import GameCommonItemListItem from '../GameCommonItemListItem.js';
import { buildReadOnlyActionBarProps, buildItemInfoBarItems } from '../listTypeConfig.js';

/**
 * Fetch a page of a game's common items through `RequestStore` (`commonItem.collection`),
 * resolving the requester's edit permission first to pick between the full catalog
 * (`common_items/all.json`, dm/admin only) and the player-facing, hidden-filtered
 * `common_items.json` — mirroring `listTypeConfig.js`'s own `fetchGameItems`/`possessionListType.js`'s
 * own `fetchGamePossessions`. Unlike `possession`, `commonItem` has no character-owned family to
 * branch on, so this is unconditionally game-level.
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read pagination params from the current hash.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched common items, pagination metadata, and the resolved edit permission.
 */
function fetchGameCommonItems(gameSlug, hashResolver) {
  return fetchRequestStoreList({
    componentName: 'ListPageController',
    resource: 'commonItem',
    params: { gameSlug },
    query: buildListQuery(hashResolver),
    canEdit: AccessStore.ensureGamePermissions(gameSlug),
  });
}

/**
 * Build a game common item's click-through href, to its game-scoped detail page (issue #826).
 *
 * @param {import('../GameCommonItemListItem.js').default} item - Wrapped game common item list
 *   item.
 * @param {{gameSlug: string}} context - Rendering context, supplying the game slug.
 * @returns {string} Hash path to the common item's detail page.
 */
function buildGameCommonItemHref(item, context) {
  return `#/games/${context.gameSlug}/common_items/${item.data.id}`;
}

/**
 * `listTypeConfig` entry for a game's common items list (`'commonItems'`, issue #826), mirroring
 * `possessionListType.js`'s own game-level entry, minus the character-owned counterparts
 * (`GameCommonItem` has no character-owned family at all).
 */
const commonItemListTypes = {
  commonItems: {
    fetchList: fetchGameCommonItems,
    wrapperClass: GameCommonItemListItem,
    filtersComponent: null,
    photoType: 'commonItem',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('game_common_items_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildGameCommonItemHref,
    itemsPerRow: 6,
  },
};

export default commonItemListTypes;
