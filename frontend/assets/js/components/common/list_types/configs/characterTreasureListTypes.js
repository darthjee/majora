import GenericClient from '../../../../client/GenericClient.js';
import GameClient from '../../../../client/GameClient.js';
import TreasureFilters from '../../../resources/treasure/pages/elements/TreasureFilters.jsx';
import TreasureCardHelper from '../../cards/helpers/TreasureCardHelper.jsx';
import CharacterTreasureListItem from '../CharacterTreasureListItem.js';
import fetchWithEditableEndpoint from './fetchWithEditableEndpoint.js';

/**
 * Resolve a character's own game currency type (`game_type`), degrading to `'dnd'` when the
 * fetch fails or the response is not ok — mirroring `CharacterGameTypeResolver`, but resolved
 * directly from a game slug rather than from an in-flight character fetch, since `fetchList`
 * has no character object of its own to merge onto.
 *
 * @param {string} gameSlug - Game slug.
 * @param {GameClient} gameClient - Game client used to fetch the game.
 * @returns {Promise<string>} Resolves to the game's currency model name.
 */
function resolveGameType(gameSlug, gameClient) {
  return gameClient.fetchGame(gameSlug, null)
    .then((response) => (response.ok ? response.json() : null))
    .then((game) => game?.game_type ?? 'dnd')
    .catch(() => 'dnd');
}

/**
 * Merge a resolved `game_type` onto every raw treasure entry in a fetch result, so
 * `CharacterTreasureListItem#formattedValue` (inherited from `TreasureListItem`) can format
 * each entry's value without needing per-item context threaded through `ListPageHelper`.
 *
 * @param {{data: object[], pagination: object, canEdit: boolean}} result - Fetch result to merge onto.
 * @param {string} gameType - Currency model name to merge onto every entry.
 * @returns {{data: object[], pagination: object, canEdit: boolean}} The result, with `game_type`
 *   merged onto every entry in `data`.
 */
function mergeGameType(result, gameType) {
  return { ...result, data: result.data.map((entry) => ({ ...entry, game_type: gameType })) };
}

/**
 * Fetch a page of a PC's owned treasures. PCs always fetch the plain, character-scoped
 * `treasures.json` endpoint — unlike NPCs, they have no hidden-inclusive `all.json` variant —
 * matching `BaseCharacterTreasuresController#fetchTreasuresIndex`'s PC branch.
 *
 * @param {string} base - Base path (`/games/{gameSlug}/pcs/{characterId}/treasures`).
 * @param {object} filterParams - Filter query params read from the current hash.
 * @param {GenericClient} client - HTTP client.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched treasures and pagination metadata; `canEdit` is always `false`, since PCs have no
 *   admin endpoint variant to gate.
 */
function fetchPcTreasuresList(base, filterParams, client) {
  return client.fetchIndex(`${base}.json`, filterParams).then(({ data, pagination }) => ({
    data: Array.isArray(data) ? data : [],
    pagination,
    canEdit: false,
  }));
}

/**
 * Fetch a page of an NPC's owned treasures, resolving the requester's game-level edit
 * permission first to pick between the full, hidden-inclusive `treasures/all.json` and the
 * regular, hidden-filtered `treasures.json` — matching
 * `BaseCharacterTreasuresController#fetchNpcTreasures`'s asymmetry with PCs.
 *
 * @param {string} gameSlug - Game slug.
 * @param {string} base - Base path (`/games/{gameSlug}/npcs/{characterId}/treasures`).
 * @param {object} filterParams - Filter query params read from the current hash.
 * @param {GenericClient} client - HTTP client.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched treasures, pagination metadata, and the resolved game-level edit permission.
 */
function fetchNpcTreasuresList(gameSlug, base, filterParams, client) {
  return fetchWithEditableEndpoint(gameSlug, base, filterParams, client);
}

/**
 * Build a `fetchList` for a character-scoped treasures list (PC or NPC), mirroring
 * `buildFetchCharacterItems` (used by `pc-items`/`npc-items`) but additionally merging the
 * character's own game currency type onto every entry (see `mergeGameType`) and preserving the
 * PC/NPC endpoint asymmetry `BaseCharacterTreasuresController` implements today (see
 * `fetchPcTreasuresList`/`fetchNpcTreasuresList`). The character id is read from the current
 * hash rather than passed explicitly, since `ListPageController` only threads a `gameSlug`
 * through to `fetchList`.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `fetchList(gameSlug, hashResolver, client?, gameClient?)` function for
 *   this character kind.
 */
function buildFetchCharacterTreasures(characterKind) {
  return function fetchCharacterTreasures(
    gameSlug, hashResolver, client = new GenericClient(), gameClient = new GameClient(),
  ) {
    const { character_id: characterId } = hashResolver.getParams(
      `/games/:game_slug/${characterKind}/:character_id/treasures`,
    );
    const filterParams = Object.fromEntries(hashResolver.getFilterParams());
    const base = `/games/${gameSlug}/${characterKind}/${characterId}/treasures`;
    const listPromise = characterKind === 'npcs'
      ? fetchNpcTreasuresList(gameSlug, base, filterParams, client)
      : fetchPcTreasuresList(base, filterParams, client);

    return Promise.all([listPromise, resolveGameType(gameSlug, gameClient)])
      .then(([result, gameType]) => mergeGameType(result, gameType));
  };
}

/**
 * Build a character-owned treasure's action-bar props: always non-manageable, since the
 * exchange/acquire/sell flow stays a page-level modal (`TreasureExchangeModal`), not a per-item
 * action.
 *
 * @returns {{canEdit: boolean, secondaryButtons: object[]}} Action-bar props for `ActionsOverlay`.
 */
function buildReadOnlyActionBarProps() {
  return { canEdit: false, secondaryButtons: [] };
}

/**
 * Build a character-owned treasure's info-bar items (the Hidden and quantity badges),
 * delegating to `TreasureCardHelper` so the badge shapes aren't duplicated here — matching
 * `CharacterTreasuresHelper.jsx`'s current `TreasureCard`/`quantity` rendering.
 *
 * @param {import('../CharacterTreasureListItem.js').default} item - Wrapped character treasure
 *   list item.
 * @returns {{key: string, label: React.ReactElement}[]} Info-bar item definitions.
 */
function buildInfoBarItems(item) {
  return TreasureCardHelper.buildInfoBarItems(item.data, item.quantity);
}

/**
 * Build a character-owned treasure's click-through href, to the underlying treasure's global
 * detail page.
 *
 * @param {import('../CharacterTreasureListItem.js').default} item - Wrapped character treasure
 *   list item.
 * @returns {string} Hash path to the treasure detail page.
 */
function buildItemHref(item) {
  return `#/treasures/${item.data.treasure_id}`;
}

/**
 * `listTypeConfig` entries for the character-scoped PC (`'pc-treasures'`) and NPC
 * (`'npc-treasures'`) owned-treasures lists.
 */
const characterTreasureListTypes = {
  'pc-treasures': {
    fetchList: buildFetchCharacterTreasures('pcs'),
    wrapperClass: CharacterTreasureListItem,
    filtersComponent: TreasureFilters,
    photoType: 'treasure',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems,
    showCaption: true,
    buildItemHref,
    itemsPerRow: 6,
  },
  'npc-treasures': {
    fetchList: buildFetchCharacterTreasures('npcs'),
    wrapperClass: CharacterTreasureListItem,
    filtersComponent: TreasureFilters,
    photoType: 'treasure',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems,
    showCaption: true,
    buildItemHref,
    itemsPerRow: 6,
  },
};

export default characterTreasureListTypes;
