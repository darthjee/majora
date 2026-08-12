import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import GameFactionListItem from '../GameFactionListItem.js';
import { buildReadOnlyActionBarProps } from '../listTypeConfig.js';

/**
 * Fetch a page of a game's factions through `RequestStore` (`faction.collection`), mirroring
 * `listTypeConfig.js`'s own `fetchGameItems` — `Faction` has no PC/NPC-owned counterpart and no
 * hidden concept, so there's no `kind` param and no edit-permission-driven endpoint split (unlike
 * `fetchTreasures`/`fetchGameItems`, both of which pick between a public and an elevated
 * endpoint), and no filters (unlike `fetchTreasures`) since the list page has no filter bar in
 * scope; `canEdit` is always `false`, since this list has no per-item manage affordance (faction
 * creation is the only gated action, on the page header itself, not per-row).
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read pagination query params from the current hash.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched factions and pagination metadata; `canEdit` is always `false`.
 */
function fetchGameFactions(gameSlug, hashResolver) {
  return fetchRequestStoreList({
    componentName: 'ListPageController',
    resource: 'faction',
    params: { gameSlug },
    query: buildListQuery(hashResolver),
    canEdit: false,
  });
}

/**
 * Build a faction's info-bar items: always empty, since `Faction` has no status/hidden concept
 * on this list page.
 *
 * @returns {Array} Always an empty array.
 */
function buildEmptyInfoBarItems() {
  return [];
}

/**
 * Build a game faction's click-through href, to its game-scoped detail page (issue #812).
 *
 * @param {import('../GameFactionListItem.js').default} item - Wrapped game faction list item.
 * @param {{gameSlug: string}} context - Rendering context, supplying the game slug.
 * @returns {string} Hash path to the faction's detail page.
 */
function buildGameFactionHref(item, context) {
  return `#/games/${context.gameSlug}/factions/${item.data.id}`;
}

/**
 * `listTypeConfig` entry for a game's factions list (`'factions'`, issue #812), mirroring
 * `possessionListType.js`'s own shape closely — game-level only, no PC/NPC-owned counterpart,
 * and no filter bar (no i18n keys were provisioned for one; matches `items`, which also has no
 * `filtersComponent`).
 */
const factionListType = {
  fetchList: fetchGameFactions,
  wrapperClass: GameFactionListItem,
  filtersComponent: null,
  photoType: 'faction',
  buildActionBarProps: buildReadOnlyActionBarProps,
  buildInfoBarItems: buildEmptyInfoBarItems,
  showCaption: true,
  buildItemHref: buildGameFactionHref,
  itemsPerRow: 6,
};

export default factionListType;
