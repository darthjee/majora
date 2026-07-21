import GenericClient from '../../../../client/GenericClient.js';
import AccessStore from '../../../../utils/access/store/AccessStore.js';
import fetchPermissionGatedIndex from '../fetchPermissionGatedIndex.js';
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
 * Build a `fetchList` for a character-scoped documents list (PC or NPC), resolving the
 * requester's character-level edit permission to pick between the full, hidden-inclusive
 * `documents/all.json` and the player-facing `documents.json`, mirroring
 * `buildFetchCharacterItems`. The character id is read from the current hash rather than
 * passed explicitly, since `ListPageController` only threads a `gameSlug` through to
 * `fetchList`.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `fetchList(gameSlug, hashResolver, client?)` function for this kind.
 */
function buildFetchCharacterDocuments(characterKind) {
  return function fetchCharacterDocuments(gameSlug, hashResolver, client = new GenericClient()) {
    const { character_id: characterId } = hashResolver.getParams(
      `/games/:game_slug/${characterKind}/:character_id/documents`,
    );
    const base = `/games/${gameSlug}/${characterKind}/${characterId}/documents`;

    return fetchPermissionGatedIndex(
      AccessStore.ensureCharacterPermissions(characterKind, gameSlug, characterId), base, undefined, client,
    );
  };
}

/**
 * Build a document's click-through href. Documents have no standalone detail page in this
 * issue (#725), so this always returns `null` — `ListPageHelper` renders a plain (non-link)
 * caption when `buildItemHref` returns a falsy value.
 *
 * @returns {null} Always `null`.
 */
function buildDocumentHref() {
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
    buildItemHref: buildDocumentHref,
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
    buildItemHref: buildDocumentHref,
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
    buildItemHref: buildDocumentHref,
    itemsPerRow: 6,
  },
};

export default documentListTypes;
