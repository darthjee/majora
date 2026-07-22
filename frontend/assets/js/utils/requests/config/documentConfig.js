/**
 * GET resource configuration for `document` (a PC's or NPC's held
 * `CharacterDocument`s) — mirrors
 * `docs/agents/access-control/character-document.md`. No detail endpoint
 * exists for `CharacterDocument`, so only `collection` is configured.
 *
 * @description Params: `gameSlug`, `kind` (`'pcs'` or `'npcs'`), `id`
 *   (character id). Both `collection`'s `private` variant
 *   (`/documents/all.json`) is character-level `can_edit`-gated on the
 *   backend for PCs (`CharacterEdit`: the PC's owning player, that game's
 *   GameMaster, or a superuser) and, for NPCs, `GameEdit` (GameMaster/admin
 *   only) — the same character-level `can_edit` already exposed
 *   per-character regardless of `kind`, resolved via
 *   `AccessStore.ensureCharacterPermissions(kind, gameSlug, id)`.
 */
export default {
  GET: {
    collection: {
      regular: {
        path: ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/documents.json`,
        permission: null,
      },
      private: {
        path: ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/documents/all.json`,
        permission: 'can_edit',
      },
    },
  },
};
