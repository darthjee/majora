/**
 * GET resource configuration for `characterDocumentPhoto` (issue #897): the underlying
 * `GameDocument`'s `GameDocumentPhoto` records, listed through a PC/NPC's `CharacterDocument`
 * photo shortlist on the character document detail page.
 *
 * @description `collection` params: `gameSlug`, `kind` (`'pcs'`/`'npcs'`), `characterId`,
 *   `documentId` (the `CharacterDocument`'s own id, not the underlying `GameDocument`'s) — mirrors
 *   `gameDocumentPhotoConfig.js`'s shape exactly, with one extra path segment for the character
 *   scope. Its `private` variant is character-edit-permission-gated (`can_edit`), same as the
 *   `gameDocumentPhoto` config.
 */
export default {
  GET: {
    collection: {
      regular: {
        path: ({ gameSlug, kind, characterId, documentId }) =>
          `/games/${gameSlug}/${kind}/${characterId}/documents/${documentId}/photos.json`,
        permission: null,
      },
      private: {
        path: ({ gameSlug, kind, characterId, documentId }) =>
          `/games/${gameSlug}/${kind}/${characterId}/documents/${documentId}/photos/all.json`,
        permission: 'can_edit',
      },
    },
  },
};
