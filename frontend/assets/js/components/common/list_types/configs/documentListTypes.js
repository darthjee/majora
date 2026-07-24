import GenericClient from '../../../../client/GenericClient.js';
import AccessStore from '../../../../utils/access/store/AccessStore.js';
import fetchPermissionGatedIndex from '../fetchPermissionGatedIndex.js';
import fetchRequestStoreList, { buildListQuery } from '../fetchRequestStoreList.js';
import { buildReadOnlyActionBarProps, buildItemInfoBarItems } from '../listTypeConfig.js';
import GameDocumentListItem from '../GameDocumentListItem.js';
import CharacterDocumentListItem from '../CharacterDocumentListItem.js';

/**
 * Fetch a page of a game's documents, resolving the requester's edit permission first to pick
 * between the full catalog (`documents/all.json`, dm/admin only) and the player-facing,
 * hidden-filtered `documents.json` — mirroring `fetchGameItems`. Documents have no filters in
 * scope, so no filter params are read/sent.
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver - Unused
 *   for this list type, kept for a uniform `fetchList` signature across list types.
 * @param {GenericClient} [client] - HTTP client override, mainly for tests.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched documents, pagination metadata, and the resolved edit permission.
 */
function fetchGameDocuments(gameSlug, hashResolver, client = new GenericClient()) {
  return fetchPermissionGatedIndex(
    AccessStore.ensureGamePermissions(gameSlug), `/games/${gameSlug}/documents`, undefined, client,
  );
}

/**
 * Build a `fetchList` for a character-scoped documents list (PC or NPC) through `RequestStore`
 * (`document.collection`), resolving the requester's character-level edit permission to pick
 * between the full, hidden-inclusive `documents/all.json` and the player-facing
 * `documents.json`, mirroring `buildFetchCharacterItems`. The character id is read from the
 * current hash rather than passed explicitly, since `ListPageController` only threads a
 * `gameSlug` through to `fetchList`.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `fetchList(gameSlug, hashResolver)` function for this kind.
 */
function buildFetchCharacterDocuments(characterKind) {
  return function fetchCharacterDocuments(gameSlug, hashResolver) {
    const { character_id: characterId } = hashResolver.getParams(
      `/games/:game_slug/${characterKind}/:character_id/documents`,
    );

    return fetchRequestStoreList({
      componentName: 'ListPageController',
      resource: 'document',
      params: { gameSlug, kind: characterKind, id: characterId },
      query: buildListQuery(hashResolver),
      canEdit: AccessStore.ensureCharacterPermissions(characterKind, gameSlug, characterId),
    });
  };
}

/**
 * Build a game document's click-through href, to its game-scoped detail page (issue #758) —
 * mirrors `listTypeConfig.js`'s `buildGameItemHref`.
 *
 * @param {import('../GameDocumentListItem.js').default} item - Wrapped game document list item.
 * @param {{gameSlug: string}} context - Rendering context, supplying the game slug.
 * @returns {string} Hash path to the document's detail page.
 */
function buildGameDocumentHref(item, context) {
  return `#/games/${context.gameSlug}/documents/${item.data.id}`;
}

/**
 * Build a character-scoped document's click-through href. Character-owned documents (PC/NPC)
 * have no standalone detail page yet (only the game-scoped `GameDocument` show page landed in
 * issue #758), so this always returns `null` — `ListPageHelper` renders a plain (non-link)
 * caption when `buildItemHref` returns a falsy value.
 *
 * @returns {null} Always `null`.
 */
function buildCharacterDocumentHref() {
  return null;
}

/**
 * `listTypeConfig` entries for the game-scoped documents (`'documents'`) and character-scoped
 * documents (`'pc-documents'`/`'npc-documents'`) lists (issue #725), split out of
 * `listTypeConfig.js` to keep it under the project's max-lines limit, mirroring
 * `characterListTypes.js`'s split.
 */
const documentListTypes = {
  documents: {
    fetchList: fetchGameDocuments,
    wrapperClass: GameDocumentListItem,
    filtersComponent: null,
    photoType: 'document',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('game_documents_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildGameDocumentHref,
    itemsPerRow: 6,
  },
  'pc-documents': {
    fetchList: buildFetchCharacterDocuments('pcs'),
    wrapperClass: CharacterDocumentListItem,
    filtersComponent: null,
    photoType: 'document',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('character_documents_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildCharacterDocumentHref,
    itemsPerRow: 6,
  },
  'npc-documents': {
    fetchList: buildFetchCharacterDocuments('npcs'),
    wrapperClass: CharacterDocumentListItem,
    filtersComponent: null,
    photoType: 'document',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildItemInfoBarItems('character_documents_page.hidden_label'),
    showCaption: true,
    buildItemHref: buildCharacterDocumentHref,
    itemsPerRow: 6,
  },
};

export default documentListTypes;
