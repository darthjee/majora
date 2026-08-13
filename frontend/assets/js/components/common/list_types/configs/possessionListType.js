import AccessStore from '../../../../utils/access/store/AccessStore.js';
import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import GamePossessionListItem from '../GamePossessionListItem.js';
import CharacterPossessionListItem from '../CharacterPossessionListItem.js';
import { buildReadOnlyActionBarProps, buildItemInfoBarItems } from '../listTypeConfig.js';

/**
 * Fetch a page of a game's possessions through `RequestStore` (`possession.collection`, `kind:
 * 'game'`), resolving the requester's edit permission first to pick between the full catalog
 * (`possessions/all.json`, dm/admin only) and the player-facing, hidden-filtered
 * `possessions.json` — mirroring `listTypeConfig.js`'s own `fetchGameItems` exactly.
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
    params: { gameSlug, kind: 'game' },
    query: buildListQuery(hashResolver),
    canEdit: AccessStore.ensureGamePermissions(gameSlug),
  });
}

/**
 * Build a `fetchList` for a character-scoped possessions list (PC or NPC) through `RequestStore`
 * (`possession.collection`, `kind: 'pcs'|'npcs'`), resolving the requester's character-level edit
 * permission to pick between the full, hidden-inclusive `possessions/all.json` and the
 * player-facing `possessions.json`, mirroring `listTypeConfig.js`'s own `buildFetchCharacterItems`
 * (issue #1076). The character id is read from the current hash rather than passed explicitly,
 * since `ListPageController` only threads a `gameSlug` through to `fetchList`.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `fetchList(gameSlug, hashResolver)` function for this kind.
 */
function buildFetchCharacterPossessions(characterKind) {
  return function fetchCharacterPossessions(gameSlug, hashResolver) {
    const { character_id: characterId } = hashResolver.getParams(
      `/games/:game_slug/${characterKind}/:character_id/possessions`,
    );

    return fetchRequestStoreList({
      componentName: 'ListPageController',
      resource: 'possession',
      params: { gameSlug, kind: characterKind, id: characterId },
      query: buildListQuery(hashResolver),
      canEdit: AccessStore.ensureCharacterPermissions(characterKind, gameSlug, characterId),
    });
  };
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
 * Build a `buildItemHref(item, context)` function for a character-scoped possessions list (PC or
 * NPC), linking to the possession's own detail page (issue #1076). Needs `context.characterId`,
 * threaded in by `CharacterPossessionsHelper` (via `ListPage`'s `context={{ characterId }}` prop),
 * mirroring `listTypeConfig.js`'s own `buildCharacterItemItemHref`.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `buildItemHref(item, context)` function for this character kind.
 */
function buildCharacterPossessionItemHref(characterKind) {
  return function buildHref(item, context) {
    return `#/games/${context.gameSlug}/${characterKind}/${context.characterId}/possessions/${item.data.id}`;
  };
}

/**
 * `listTypeConfig` entries for a game's possessions list (`'possessions'`, issue #1074) and the
 * character-scoped possessions lists (`'pc-possessions'`/`'npc-possessions'`, issue #1076),
 * mirroring `documentListTypes.js`'s own game/pc/npc split.
 */
const possessionListTypes = {
  possessions: {
    fetchList: fetchGamePossessions,
    wrapperClass: GamePossessionListItem,
    filtersComponent: null,
    photoType: 'possession',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('game_possessions_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildGamePossessionHref,
    itemsPerRow: 6,
  },
  'pc-possessions': {
    fetchList: buildFetchCharacterPossessions('pcs'),
    wrapperClass: CharacterPossessionListItem,
    filtersComponent: null,
    photoType: 'possession',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('character_possessions_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildCharacterPossessionItemHref('pcs'),
    itemsPerRow: 6,
  },
  'npc-possessions': {
    fetchList: buildFetchCharacterPossessions('npcs'),
    wrapperClass: CharacterPossessionListItem,
    filtersComponent: null,
    photoType: 'possession',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('character_possessions_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildCharacterPossessionItemHref('npcs'),
    itemsPerRow: 6,
  },
};

export default possessionListTypes;
