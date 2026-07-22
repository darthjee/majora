/**
 * GET resource configuration for `item` — mirrors two distinct endpoint
 * families under one resource name: a PC's or NPC's held `CharacterItem`s
 * (`docs/agents/access-control/character-item.md`, `kind: 'pcs'|'npcs'`) and
 * a game's own `GameItem`s (`docs/agents/access-control/game-item.md`,
 * `kind: 'game'`) — genuinely different backing models, but the same
 * regular-vs-`full.json`-on-`can_edit` shape, so `single` picks the right
 * path family from `kind` rather than needing a separate resource name.
 *
 * @description `collection` params (character-owned only today): `gameSlug`,
 *   `kind` (`'pcs'` or `'npcs'`), `id` (character id). Its `private` variant
 *   (`/items/all.json`) is `CharacterEditPermission`-gated on the backend —
 *   the PC's owning player, that game's GameMaster, or a superuser for PCs;
 *   GameMaster/admin only for NPCs (no owner) — i.e. the same character-level
 *   `can_edit` already exposed per-character, resolved via
 *   `AccessStore.ensureCharacterPermissions(kind, gameSlug, id)`.
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

export default {
  GET: {
    collection: {
      regular: {
        path: ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items.json`,
        permission: null,
      },
      private: {
        path: ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items/all.json`,
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
};
