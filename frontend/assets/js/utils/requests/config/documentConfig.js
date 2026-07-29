/**
 * GET resource configuration for `document`. `collection` covers a PC's or NPC's held
 * `CharacterDocument`s — mirrors `docs/agents/access-control/character-document.md`.
 * `single` covers two distinct endpoint families under one resource name, mirroring
 * `itemConfig.js`'s own dual-family `single` branching (issue #892): a game's own `GameDocument`
 * detail (issue #758, `kind: 'game'`) and a PC's or NPC's held `CharacterDocument` detail (issue
 * #892, `kind: 'pcs'|'npcs'`) — the same regular-vs-`full.json`-on-`can_edit` shape, so `single`
 * picks the right path family from `kind` rather than needing a separate resource name.
 *
 * @description `collection` params: `gameSlug`, `kind` (`'pcs'` or `'npcs'`), `id` (character
 *   id). Its `private` variant (`/documents/all.json`) is character-level `can_edit`-gated on
 *   the backend for PCs (`CharacterEdit`: the PC's owning player, that game's GameMaster, or a
 *   superuser) and, for NPCs, `GameEdit` (GameMaster/admin only) — the same character-level
 *   `can_edit` already exposed per-character regardless of `kind`, resolved via
 *   `AccessStore.ensureCharacterPermissions(kind, gameSlug, id)`.
 *
 *   `single` params: `gameSlug`, `kind` (`'pcs'`, `'npcs'`, or `'game'`), `id` — the character id
 *   for `kind: 'pcs'|'npcs'`, or the `GameDocument`'s own id for `kind: 'game'` — and, for the
 *   character-owned kinds only, `documentId` (the `CharacterDocument`'s id). Both families'
 *   `private` variants (`/documents/:document_id/full.json`, `/documents/:id/full.json`) carry the
 *   same `can_edit` permission key, but resolved at different scopes — character-level
 *   (`AccessStore.ensureCharacterPermissions`) for `'pcs'|'npcs'`, game-level
 *   (`AccessStore.ensureGamePermissions`, `GameEditPermission` on the backend) for `'game'` — see
 *   `RequestPermissionResolvers.js`. `CharacterDocument` carries no `description`/`photo` of its
 *   own to flavor (issue #892 stripped those overrides), so its `full.json` variant only adds
 *   `hidden` on top of the public shape.
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
 *   photo-upload path to split against (out of scope for issue #727; `CharacterDocument` still has
 *   no photo of its own after issue #892, only the linked `GameDocument`'s), so `regular`/`private`
 *   point at the exact same object. Params: `gameSlug`, `id` (the `GameDocument`'s own id).
 *   Gated by `GameDocumentPhotoUploadPermission` on the backend (staff, any player of the game,
 *   or the game's dm/editor) — `permission` is `null` here, matching `itemConfig.js`'s own
 *   `photoUploadInit`, since the upload init endpoint itself carries no `can_edit`-style flag to
 *   resolve against.
 *
 *   `POST.file` (file-upload init, issue #726) mirrors `POST.single` above but targets the new
 *   `.../documents/:id/file_upload.json` route — its own quantity-type key rather than reusing
 *   `single`, since a `GameDocument` is document-scoped either way but the two init endpoints are
 *   distinct routes (photo vs. file). Params: `gameSlug`, `id` (the `GameDocument`'s own id).
 *   Gated by the new `GameDocumentFileUploadPermission` on the backend (identical role set to
 *   `GameDocumentPhotoUploadPermission`) — `permission` is `null` here for the same reason as
 *   `POST.single`.
 *
 *   `POST.filePhoto` (file-photo-upload init, issue #878) targets the new
 *   `.../documents/:id/files/:fileId/photo_upload.json` route — mirrors `itemConfig.js`'s own
 *   two-id `characterPhotoUploadPath` shape (a document id plus the target file's own id) rather
 *   than `POST.file`/`POST.single`'s single-id shape, since this endpoint uploads onto one
 *   specific `GameDocumentFile`'s photo, not the document itself. Params: `gameSlug`, `id` (the
 *   `GameDocument`'s own id), `fileId` (the `GameDocumentFile`'s own id, only known after the
 *   file itself has been created via `POST.file`). Gated by the new
 *   `GameDocumentFilePhotoUploadPermission` on the backend (identical role set to
 *   `GameDocumentFileUploadPermission`) — `permission` is `null` here for the same reason as
 *   `POST.single`/`POST.file`.
 */
const gameDocumentCreate = { path: ({ gameSlug }) => `/games/${gameSlug}/documents.json`, permission: 'can_edit' };

const documentPhotoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/photo_upload.json`,
  permission: null,
};

const documentFileUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/file_upload.json`,
  permission: null,
};

const documentFilePhotoUploadInit = {
  path: ({ gameSlug, id, fileId }) => `/games/${gameSlug}/documents/${id}/files/${fileId}/photo_upload.json`,
  permission: null,
};

/**
 * Build the player-facing single-`CharacterDocument` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @param {string|number} params.documentId - `CharacterDocument` id.
 * @returns {string} The endpoint path.
 */
const characterSinglePath = ({
  gameSlug, kind, id, documentId,
}) => `/games/${gameSlug}/${kind}/${id}/documents/${documentId}.json`;

/**
 * Build the full (editor-only) single-`CharacterDocument` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @param {string|number} params.documentId - `CharacterDocument` id.
 * @returns {string} The endpoint path.
 */
const characterSingleFullPath = ({
  gameSlug, kind, id, documentId,
}) => `/games/${gameSlug}/${kind}/${id}/documents/${documentId}/full.json`;

/**
 * Build the player-facing single-`GameDocument` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GameDocument` id.
 * @returns {string} The endpoint path.
 */
const gameSinglePath = ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}.json`;

/**
 * Build the full (editor-only) single-`GameDocument` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GameDocument` id.
 * @returns {string} The endpoint path.
 */
const gameSingleFullPath = ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/full.json`;

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
        path: (params) => (params.kind === 'game' ? gameSinglePath(params) : characterSinglePath(params)),
        permission: null,
      },
      private: {
        path: (params) => (params.kind === 'game' ? gameSingleFullPath(params) : characterSingleFullPath(params)),
        permission: 'can_edit',
      },
    },
  },
  POST: {
    gameCollection: { regular: gameDocumentCreate, private: gameDocumentCreate },
    single: { regular: documentPhotoUploadInit, private: documentPhotoUploadInit },
    file: { regular: documentFileUploadInit, private: documentFileUploadInit },
    filePhoto: { regular: documentFilePhotoUploadInit, private: documentFilePhotoUploadInit },
  },
};
