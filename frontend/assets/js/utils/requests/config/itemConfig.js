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
};
