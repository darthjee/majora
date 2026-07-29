/**
 * GET resource configuration for `characterDocumentFile` (issue #897): the underlying
 * `GameDocument`'s `GameDocumentFile` records, listed through a PC/NPC's `CharacterDocument` file
 * shortlist on the character document detail page.
 *
 * @description `collection` params: `gameSlug`, `kind` (`'pcs'`/`'npcs'`), `characterId`,
 *   `documentId` (the `CharacterDocument`'s own id, not the underlying `GameDocument`'s) — mirrors
 *   `gameDocumentFileConfig.js`'s shape exactly, with one extra path segment for the character
 *   scope. Its `private` variant is character-edit-permission-gated (`can_edit`), same as the
 *   `gameDocumentFile` config.
 */
export default {
  GET: {
    collection: {
      regular: {
        path: ({ gameSlug, kind, characterId, documentId }) =>
          `/games/${gameSlug}/${kind}/${characterId}/documents/${documentId}/files.json`,
        permission: null,
      },
      private: {
        path: ({ gameSlug, kind, characterId, documentId }) =>
          `/games/${gameSlug}/${kind}/${characterId}/documents/${documentId}/files/all.json`,
        permission: 'can_edit',
      },
    },
  },
};
