import AccessStore from '../../../../utils/access/store/AccessStore.js';
import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import { buildReadOnlyActionBarProps, buildItemInfoBarItems } from '../listTypeConfig.js';
import CharacterFactionListItem from '../CharacterFactionListItem.js';

/**
 * Build a `fetchList` for a character-scoped factions list (PC or NPC) through `RequestStore`
 * (`faction.collection`, `kind: 'pcs'|'npcs'`), resolving the requester's character-level edit
 * permission to pick between the full, hidden-inclusive `factions/all.json` and the
 * player-facing `factions.json`, mirroring `documentListTypes.js`'s own
 * `buildFetchCharacterDocuments`. The character id is read from the current hash rather than
 * passed explicitly, since `ListPageController` only threads a `gameSlug` through to `fetchList`.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `fetchList(gameSlug, hashResolver)` function for this kind.
 */
function buildFetchCharacterFactions(characterKind) {
  return function fetchCharacterFactions(gameSlug, hashResolver) {
    const { character_id: characterId } = hashResolver.getParams(
      `/games/:game_slug/${characterKind}/:character_id/factions`,
    );

    return fetchRequestStoreList({
      componentName: 'ListPageController',
      resource: 'faction',
      params: { gameSlug, kind: characterKind, id: characterId },
      query: buildListQuery(hashResolver),
      canEdit: AccessStore.ensureCharacterPermissions(characterKind, gameSlug, characterId),
    });
  };
}

/**
 * Build a `CharacterFaction`'s click-through href, to its linked `GameFaction`'s own game-scoped
 * detail page (issue #943) — unlike `documentListTypes.js`'s own `buildCharacterDocumentItemHref`,
 * there is no dedicated `CharacterFaction` detail page to link to instead (see
 * `shortListResourceConfig.js`'s `faction` entry for why).
 *
 * @param {import('../CharacterFactionListItem.js').default} item - Wrapped character faction list
 *   item.
 * @param {{gameSlug: string}} context - Rendering context, supplying the game slug.
 * @returns {string} Hash path to the faction's own detail page.
 */
function buildCharacterFactionItemHref(item, context) {
  return `#/games/${context.gameSlug}/factions/${item.data.game_faction_id}`;
}

/**
 * `listTypeConfig` entries for the character-scoped factions lists (`'pc-factions'`/
 * `'npc-factions'`, issue #943), mirroring `documentListTypes.js`'s own pc/npc split — split out
 * into its own file (rather than folded into `factionListType.js`, which already owns the
 * game-level `'factions'` entry) to keep each file focused on one family, the same way
 * `documentListTypes.js` is kept separate from `possessionListType.js`.
 */
const factionListTypes = {
  'pc-factions': {
    fetchList: buildFetchCharacterFactions('pcs'),
    wrapperClass: CharacterFactionListItem,
    filtersComponent: null,
    photoType: 'faction',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('character_factions_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildCharacterFactionItemHref,
    itemsPerRow: 6,
  },
  'npc-factions': {
    fetchList: buildFetchCharacterFactions('npcs'),
    wrapperClass: CharacterFactionListItem,
    filtersComponent: null,
    photoType: 'faction',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('character_factions_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildCharacterFactionItemHref,
    itemsPerRow: 6,
  },
};

export default factionListTypes;
