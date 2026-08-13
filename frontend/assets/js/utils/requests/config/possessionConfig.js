/**
 * GET/PATCH/POST resource configuration for `possession` — covers two distinct endpoint families
 * under one resource name, mirroring `itemConfig.js`'s own dual-family shape (issue #1076): a
 * game's own `GamePossession`s (issue #1074, `kind: 'game'`) and a PC's or NPC's held
 * `CharacterPossession`s (issue #1076, `kind: 'pcs'|'npcs'`) — genuinely different backing
 * models, but the same regular-vs-`full.json`-on-`can_edit` shape, so `GET.collection`/
 * `GET.single`/`POST.collection` pick the right path family from `kind` rather than needing a
 * separate resource name.
 *
 * @description `collection` params: `gameSlug`, `kind` (`'pcs'`, `'npcs'`, or `'game'`), and, for
 *   the character-owned kinds only, `id` (character id). For `'pcs'|'npcs'`, the `private`
 *   variant (`/possessions/all.json`) is `CharacterEditPermission`-gated on the backend, resolved
 *   via `AccessStore.ensureCharacterPermissions(kind, gameSlug, id)`. For `'game'`, the `private`
 *   variant (`/games/:game_slug/possessions/all.json`) is `GameEditPermission`-gated (game-level
 *   `can_edit`), resolved via `AccessStore.ensureGamePermissions(gameSlug)` — mirroring `single`'s
 *   own `'game'`-kind resolution. See `RequestPermissionResolvers.js`.
 *
 *   `single` params: `gameSlug`, `kind` (`'pcs'`, `'npcs'`, or `'game'`), `id` — the character id
 *   for `kind: 'pcs'|'npcs'`, or the `GamePossession`'s own id for `kind: 'game'` — and, for the
 *   character-owned kinds only, `possessionId` (the `CharacterPossession`'s id). Both families'
 *   `private` variants carry the same `can_edit` permission key, but resolved at different scopes
 *   — character-level for `'pcs'|'npcs'`, game-level (`GameEditPermission`) for `'game'`.
 *   `CharacterPossession` carries no `description`/`photo` override of its own (issue #1076
 *   follows `CharacterDocument`'s thin-join precedent), so its `full.json` variant only adds
 *   `hidden` on top of the public shape.
 *
 *   `PATCH.single` (update) reuses `single`'s own game-owned path, unbranched — there is no
 *   character-level override to `PATCH` (issue #1076's edit page acts on the `GamePossession`
 *   directly, by its own id), gated inline by `GameEditPermission` on the backend (dm/admin/
 *   superuser only, no staff bypass) — mirroring `GameItem`'s own `PATCH`. No separate `/full.json`
 *   counterpart exists for `PATCH`, so `regular`/`private` point at the exact same object.
 *
 *   `POST.collection` (create) picks the right path family from `kind`, mirroring `GET.collection`
 *   above: `'game'` creates a bare `GamePossession` (`GamePossessionCreatePermission`), while
 *   `'pcs'|'npcs'` creates a `GamePossession` + `CharacterPossession` together in one call
 *   (`regular.create_update` on `game_pc_possession`/`game_npc_possession`, issue #1076). No
 *   restricted/full variant exists for creation itself, so `regular`/`private` point at the exact
 *   same object for both families.
 *
 *   `POST.single` (photo-upload init) stays unconditionally game-owned, unbranched — there is no
 *   character-level photo override to upload against (issue #1076's new/edit/detail pages all
 *   upload directly onto the `GamePossession`'s own photo by its id), gated by
 *   `GamePossessionPhotoUploadPermission` on the backend (staff and any player of the game). No
 *   restricted/full variant exists, so `regular`/`private` point at the exact same object. Params:
 *   `gameSlug`, `id` (the `GamePossession`'s own id).
 *
 *   `GET.availableCollection`/`POST.acquire`/`POST.remove` (issue #1076) back the possession
 *   exchange modal's Acquire/Remove tabs, mirroring `documentConfig.js`'s own
 *   `availableCollection`/`acquire`/`remove` shape exactly (character-owned kinds only, `kind:
 *   'pcs'|'npcs'`). Params: `gameSlug`, `kind`, `id`. `private` is the DM/admin-only endpoint
 *   variant accepting a hidden `GamePossession`/`CharacterPossession`; callers pass `variantName`
 *   explicitly (see `AcquirePossessionTabController.js`/`RemovePossessionTabController.js`), so
 *   `permission` here is documentation-only.
 */
/**
 * Build the player-facing single-`CharacterPossession` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @param {string|number} params.possessionId - `CharacterPossession` id.
 * @returns {string} The endpoint path.
 */
const characterSinglePath = ({
  gameSlug, kind, id, possessionId,
}) => `/games/${gameSlug}/${kind}/${id}/possessions/${possessionId}.json`;

/**
 * Build the full (editor-only) single-`CharacterPossession` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @param {string|number} params.possessionId - `CharacterPossession` id.
 * @returns {string} The endpoint path.
 */
const characterSingleFullPath = ({
  gameSlug, kind, id, possessionId,
}) => `/games/${gameSlug}/${kind}/${id}/possessions/${possessionId}/full.json`;

/**
 * Build the player-facing single-`GamePossession` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GamePossession` id.
 * @returns {string} The endpoint path.
 */
const gameSinglePath = ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}.json`;

/**
 * Build the full (editor-only) single-`GamePossession` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GamePossession` id.
 * @returns {string} The endpoint path.
 */
const gameSingleFullPath = ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}/full.json`;

/**
 * Build the player-facing game-owned possessions collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @returns {string} The endpoint path.
 */
const gameCollectionPath = ({ gameSlug }) => `/games/${gameSlug}/possessions.json`;

/**
 * Build the full (editor-only) game-owned possessions collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @returns {string} The endpoint path.
 */
const gameCollectionFullPath = ({ gameSlug }) => `/games/${gameSlug}/possessions/all.json`;

/**
 * Build the player-facing character-owned possessions collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const characterCollectionPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/possessions.json`;

/**
 * Build the full (editor-only) character-owned possessions collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const characterCollectionFullPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/possessions/all.json`;

/**
 * Build the player-facing available-possessions (Acquire catalog) path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const availablePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/possessions/available.json`;

/**
 * Build the DM/admin-only available-possessions (Acquire catalog, including hidden) path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const availableAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/possessions/available/all.json`;

/**
 * Build the player-facing and DM/admin-only possession-acquire paths (the latter also accepts a
 * hidden `GamePossession`) — issue #1076's possession exchange modal.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const acquirePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/possessions/acquire.json`;
const acquireAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/possessions/acquire/all.json`;

/**
 * Build the player-facing and DM/admin-only possession-remove paths (the latter also accepts a
 * hidden `CharacterPossession`) — issue #1076's possession exchange modal.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const removePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/possessions/remove.json`;
const removeAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/possessions/remove/all.json`;

const patchSingle = {
  path: (params) => gameSinglePath(params),
  permission: 'can_edit',
};
const createCollection = {
  path: (params) => (params.kind === 'game' ? gameCollectionPath(params) : characterCollectionPath(params)),
  permission: 'can_edit',
};
const photoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}/photo_upload.json`,
  permission: null,
};

export default {
  GET: {
    collection: {
      regular: {
        path: (params) => (params.kind === 'game' ? gameCollectionPath(params) : characterCollectionPath(params)),
        permission: null,
      },
      private: {
        path: (params) => (
          params.kind === 'game' ? gameCollectionFullPath(params) : characterCollectionFullPath(params)
        ),
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
    availableCollection: {
      regular: { path: availablePath, permission: null },
      private: { path: availableAllPath, permission: 'can_edit' },
    },
  },
  PATCH: {
    single: { regular: patchSingle, private: patchSingle },
  },
  POST: {
    collection: { regular: createCollection, private: createCollection },
    single: { regular: photoUploadInit, private: photoUploadInit },
    acquire: {
      regular: { path: acquirePath, permission: null },
      private: { path: acquireAllPath, permission: 'can_edit' },
    },
    remove: {
      regular: { path: removePath, permission: null },
      private: { path: removeAllPath, permission: 'can_edit' },
    },
  },
};
