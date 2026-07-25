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
 *
 *   `POST.gameCollection` (create, `/games/:game_slug/documents.json`) creates a bare
 *   `GameDocument` — deliberately its own quantity-type key, not `POST.collection`, since
 *   `GET.collection` above already means something different (a *character's* held
 *   `CharacterDocument`s, resolved at the character level): reusing `collection` for this
 *   game-level create would make `RequestPermissionResolvers`'s existing `document.collection`
 *   resolver (which expects `kind`/`id`) resolve permissions for the wrong scope. Gated by
 *   `GameDocumentCreatePermission` (a strict superset of `GameEditPermission` — staff always
 *   included); no restricted/full variant exists for creation itself, so `regular`/`private`
 *   point at the exact same object.
 *
 *   `POST.single` (photo-upload init, issue #727) mirrors `itemConfig.js`'s own game-owned
 *   `photoUploadInit` shape, but unbranched — there is no character-owned `CharacterDocument`
 *   photo-upload path to split against (out of scope for issue #727), so `regular`/`private`
 *   point at the exact same object. Params: `gameSlug`, `id` (the `GameDocument`'s own id).
 *   Gated by `GameDocumentPhotoUploadPermission` on the backend (staff, any player of the game,
 *   or the game's dm/editor) — `permission` is `null` here, matching `itemConfig.js`'s own
 *   `photoUploadInit`, since the upload init endpoint itself carries no `can_edit`-style flag to
 *   resolve against.
 */
const gameDocumentCreate = { path: ({ gameSlug }) => `/games/${gameSlug}/documents.json`, permission: 'can_edit' };

const documentPhotoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/photo_upload.json`,
  permission: null,
};

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
  POST: {
    gameCollection: { regular: gameDocumentCreate, private: gameDocumentCreate },
    single: { regular: documentPhotoUploadInit, private: documentPhotoUploadInit },
  },
};
