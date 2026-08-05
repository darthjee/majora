/**
 * GET resource configuration for `item` — mirrors two distinct endpoint
 * families under one resource name: a PC's or NPC's held `CharacterItem`s
 * (`docs/agents/access-control/character-item.md`, `kind: 'pcs'|'npcs'`) and
 * a game's own `GameItem`s (`docs/agents/access-control/game-item.md`,
 * `kind: 'game'`) — genuinely different backing models, but the same
 * regular-vs-`full.json`-on-`can_edit` shape, so `single` picks the right
 * path family from `kind` rather than needing a separate resource name.
 *
 * @description `collection` params: `gameSlug`, `kind` (`'pcs'`, `'npcs'`, or `'game'`), and,
 *   for the character-owned kinds only, `id` (character id) — mirroring `single`'s own
 *   kind-based path-family split. For `'pcs'|'npcs'`, the `private` variant (`/items/all.json`)
 *   is `CharacterEditPermission`-gated on the backend — the PC's owning player, that game's
 *   GameMaster, or a superuser for PCs; GameMaster/admin only for NPCs (no owner) — i.e. the
 *   same character-level `can_edit` already exposed per-character, resolved via
 *   `AccessStore.ensureCharacterPermissions(kind, gameSlug, id)`. For `'game'`, the `private`
 *   variant (`/games/:game_slug/items/all.json`) is `GameEditPermission`-gated (game-level
 *   `can_edit`), resolved via `AccessStore.ensureGamePermissions(gameSlug)` — mirroring
 *   `single`'s own `'game'`-kind resolution.
 *
 *   `single` params: `gameSlug`, `kind` (`'pcs'`, `'npcs'`, or `'game'`),
 *   `id` — the character id for `kind: 'pcs'|'npcs'`, or the `GameItem`'s own
 *   id for `kind: 'game'` — and, for the character-owned kinds only,
 *   `itemId` (the `CharacterItem`'s id). Both families' `private` variants
 *   (`/items/:item_id/full.json`, `/items/:id/full.json`) carry the same
 *   `can_edit` permission key, but resolved at different scopes —
 *   character-level (`AccessStore.ensureCharacterPermissions`) for
 *   `'pcs'|'npcs'`, game-level (`AccessStore.ensureGamePermissions`,
 *   `GameEditPermission` on the backend) for `'game'` — see
 *   `RequestPermissionResolvers.js`.
 *
 *   `availableCollection` params: `gameSlug`, `kind` (`'pcs'` or `'npcs'` only — there is no
 *   `'game'` variant), and `id` (character id). Backs the item exchange modal's Acquire tab
 *   (issue #773): the game's `GameItem` catalog minus the `GameItem`s the character already
 *   owns. Unlike `collection`/`single` above, `private` (`/items/available/all.json`) is
 *   **game-level**-gated (`GameEditPermission`, dm/admin only, no owner) even though the path is
 *   character-scoped — see `RequestPermissionResolvers.js`'s `item.availableCollection` resolver
 *   for why this deliberately does not mirror `collection`'s per-kind branching.
 *
 *   `PATCH.single` (update) reuses `single`'s own `gameSinglePath`/`characterSinglePath`
 *   builders — confirmed against `game_item_detail.py`/the `character-item.md`/`game-item.md`
 *   access-control docs that both families' `PATCH` shares the exact same route as their `GET`
 *   (no separate `/full.json` counterpart exists for `PATCH`, unlike PC/NPC's own `PATCH.single`
 *   split), gated inline by `GameEditPermission`/`CharacterItemCreatePermission` respectively —
 *   so `regular`/`private` point at the exact same object.
 *
 *   `POST.collection` (create) reuses `collection`'s own `gameCollectionPath`/
 *   `characterCollectionPath` builders, gated by `GameItemCreatePermission`/
 *   `CharacterItemCreatePermission` (both a strict superset of `GameEditPermission`/
 *   `CharacterEditPermission` — staff always included) — no restricted/full variant exists for
 *   creation itself, so `regular`/`private` point at the exact same object.
 *
 *   `POST.single` (photo-upload init) has its own dual-family path split, mirroring `single`'s
 *   own `kind`-based branching, but hits a *different* underlying id depending on the family: the
 *   `'game'` kind uploads directly onto the `GameItem`'s own photo
 *   (`/games/:game_slug/items/:id/photo_upload.json`, `id` the `GameItem`'s id — used both by
 *   `GameItemNewController`/`GameItemEditController`'s own item and, deliberately, by
 *   `CharacterItemNewController`'s post-creation upload, which targets the newly-created
 *   `GameItem` directly rather than the character-owned override below); the character-owned
 *   kinds override the *character's own* held copy instead
 *   (`/games/:game_slug/:kind/:id/items/:item_id/photo_upload.json`, `id` the character id,
 *   `item_id` the `CharacterItem`'s own id — confirmed against
 *   `backend/games/views/game/_item_photo_upload.py`, which looks the item up via
 *   `character.character_items`, i.e. by `CharacterItem` pk, not `GameItem` pk). Gated by
 *   `GameItemPhotoUploadPermission`/`CharacterItemPhotoUploadPermission` respectively — no
 *   restricted/full variant, so `regular`/`private` point at the exact same object.
 *
 *   `POST.acquire`/`POST.remove` (issue #844) back the item exchange modal's Acquire/Remove tabs,
 *   character-owned kinds only (`kind: 'pcs'|'npcs'`). Params: `gameSlug`, `kind`, `id`. `private`
 *   is the DM/admin-only endpoint accepting a hidden `GameItem`/`CharacterItem`; callers pass
 *   `variantName` explicitly, so `permission` here is documentation-only.
 *
 *   `GET.summary` (issue #827) backs the give-item modal's receiving list: how many of a given
 *   `GameItem` a character owns. Params: `gameSlug`, `itemId`, `kind`, `id`. `skipCache: true` on
 *   both variants (not worth caching). See the `summary` entry's own comment below for why
 *   `can_edit` is the correct `private`-tier permission key for both pcs and npcs.
 */
/**
 * Build the player-facing single-`CharacterItem` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @param {string|number} params.itemId - `CharacterItem` id.
 * @returns {string} The endpoint path.
 */
const characterSinglePath = ({ gameSlug, kind, id, itemId }) => `/games/${gameSlug}/${kind}/${id}/items/${itemId}.json`;

/**
 * Build the full (editor-only) single-`CharacterItem` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @param {string|number} params.itemId - `CharacterItem` id.
 * @returns {string} The endpoint path.
 */
const characterSingleFullPath = ({ gameSlug, kind, id, itemId }) =>
  `/games/${gameSlug}/${kind}/${id}/items/${itemId}/full.json`;

/**
 * Build the player-facing single-`GameItem` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GameItem` id.
 * @returns {string} The endpoint path.
 */
const gameSinglePath = ({ gameSlug, id }) => `/games/${gameSlug}/items/${id}.json`;

/**
 * Build the full (editor-only) single-`GameItem` path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GameItem` id.
 * @returns {string} The endpoint path.
 */
const gameSingleFullPath = ({ gameSlug, id }) => `/games/${gameSlug}/items/${id}/full.json`;

/**
 * Build the player-facing game-owned items collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @returns {string} The endpoint path.
 */
const gameCollectionPath = ({ gameSlug }) => `/games/${gameSlug}/items.json`;

/**
 * Build the full (editor-only) game-owned items collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @returns {string} The endpoint path.
 */
const gameCollectionFullPath = ({ gameSlug }) => `/games/${gameSlug}/items/all.json`;

/**
 * Build the player-facing character-owned items collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const characterCollectionPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items.json`;

/**
 * Build the full (editor-only) character-owned items collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const characterCollectionFullPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items/all.json`;

/**
 * Build the player-facing available-items (Acquire catalog) path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const availablePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items/available.json`;

/**
 * Build the DM/admin-only available-items (Acquire catalog, including hidden) path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const availableAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items/available/all.json`;

/**
 * Build the game-owned item's own photo-upload-init path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string|number} params.id - `GameItem` id.
 * @returns {string} The endpoint path.
 */
const gamePhotoUploadPath = ({ gameSlug, id }) => `/games/${gameSlug}/items/${id}/photo_upload.json`;

/**
 * Build the character-owned item's own photo-upload-init path (overrides the character's held
 * copy, not the underlying `GameItem`'s own photo — see `itemId`).
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @param {string|number} params.itemId - `CharacterItem` id.
 * @returns {string} The endpoint path.
 */
const characterPhotoUploadPath = ({ gameSlug, kind, id, itemId }) =>
  `/games/${gameSlug}/${kind}/${id}/items/${itemId}/photo_upload.json`;

/**
 * Build the player-facing and DM/admin-only item-acquire paths (the latter also accepts a
 * hidden `GameItem`) — issue #844's item exchange modal.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const acquirePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items/acquire.json`;
const acquireAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items/acquire/all.json`;

// Per-character item-summary paths (issue #827's give-item modal). `itemId` is the `GameItem`
// being given; `kind`/`id` identify the receiving character.
const summaryPath = ({
  gameSlug, itemId, kind, id,
}) => `/games/${gameSlug}/items/${itemId}/${kind}/${id}/summary.json`;
const summaryAllPath = ({
  gameSlug, itemId, kind, id,
}) => `/games/${gameSlug}/items/${itemId}/${kind}/${id}/summary/all.json`;

/**
 * Build the player-facing and DM/admin-only item-remove paths (the latter also accepts a
 * hidden `CharacterItem`) — issue #844's item exchange modal.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const removePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items/remove.json`;
const removeAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items/remove/all.json`;

const patchSingle = {
  path: (params) => (params.kind === 'game' ? gameSinglePath(params) : characterSinglePath(params)),
  permission: 'can_edit',
};
const createCollection = {
  path: (params) => (params.kind === 'game' ? gameCollectionPath(params) : characterCollectionPath(params)),
  permission: 'can_edit',
};
const photoUploadInit = {
  path: (params) => (params.kind === 'game' ? gamePhotoUploadPath(params) : characterPhotoUploadPath(params)),
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
    // issue #827: the backend's `check_item_summary_all_permission` reuses `_check_item_create`'s
    // `game_pc_item` `restricted.create` tier (`[staff, owner]`, plus the universal admin/dm
    // shortcut baked into every tier check), so `/summary/all.json` already resolves to
    // dm/admin/owner for pcs and dm/admin for npcs — exactly what the existing character-level
    // `can_edit` field already exposes (`game_pc/ui.yml`'s `edit: [owner]` for pcs,
    // `game_npc/ui.yml`'s `edit: []` for npcs, both plus the same admin/dm shortcut), matching the
    // `items/all.json` precedent (`docs/agents/access-control/character-item.md`'s "`hidden`"
    // section). No kind-based branching needed.
    summary: {
      regular: { path: summaryPath, permission: null, skipCache: true },
      private: { path: summaryAllPath, permission: 'can_edit', skipCache: true },
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
