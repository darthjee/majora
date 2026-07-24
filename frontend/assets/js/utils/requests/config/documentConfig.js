/**
 * GET resource configuration for `document`. `collection` covers a PC's or NPC's held
 * `CharacterDocument`s — mirrors `docs/agents/access-control/character-document.md`; no
 * detail endpoint exists for `CharacterDocument`, so `collection` is character-scoped only.
 * `single` covers a game's own `GameDocument` detail (issue #758) — mirrors
 * `docs/agents/access-control/game-document.md`'s "Document detail endpoints"; only the
 * `kind: 'game'` family exists so far (no character-document detail endpoint), unlike
 * `itemConfig.js`'s dual-family `single` branching.
 *
 * @description `collection` params: `gameSlug`, `kind` (`'pcs'` or `'npcs'`), `id` (character
 *   id). Its `private` variant (`/documents/all.json`) is character-level `can_edit`-gated on
 *   the backend for PCs (`CharacterEdit`: the PC's owning player, that game's GameMaster, or a
 *   superuser) and, for NPCs, `GameEdit` (GameMaster/admin only) — the same character-level
 *   `can_edit` already exposed per-character regardless of `kind`, resolved via
 *   `AccessStore.ensureCharacterPermissions(kind, gameSlug, id)`.
 *
 *   `single` params: `gameSlug`, `id` (the `GameDocument`'s own id). Its `private` variant
 *   (`/games/:game_slug/documents/:id/full.json`) is `GameEditPermission`-gated (game-level
 *   `can_edit`), resolved via `AccessStore.ensureGamePermissions(gameSlug)` — see
 *   `RequestPermissionResolvers.js`.
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
    single: {
      regular: {
        path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}.json`,
        permission: null,
      },
      private: {
        path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/full.json`,
        permission: 'can_edit',
      },
    },
  },
};
