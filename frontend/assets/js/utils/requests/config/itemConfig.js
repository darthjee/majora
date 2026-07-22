/**
 * GET resource configuration for `item` (a PC's or NPC's held
 * `CharacterItem`s) — mirrors `docs/agents/access-control/character-item.md`.
 *
 * @description Params: `gameSlug`, `kind` (`'pcs'` or `'npcs'`), `id`
 *   (character id), and, for `single`, `itemId`. Both `collection`'s and
 *   `single`'s `private` variants (`/items/all.json`, `/items/:item_id/
 *   full.json`) are `CharacterEditPermission`-gated on the backend — the
 *   PC's owning player, that game's GameMaster, or a superuser for PCs;
 *   GameMaster/admin only for NPCs (no owner) — i.e. the same character-level
 *   `can_edit` already exposed per-character, resolved via
 *   `AccessStore.ensureCharacterPermissions(kind, gameSlug, id)` regardless
 *   of `kind`.
 */
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
        path: ({ gameSlug, kind, id, itemId }) => `/games/${gameSlug}/${kind}/${id}/items/${itemId}.json`,
        permission: null,
      },
      private: {
        path: ({ gameSlug, kind, id, itemId }) => `/games/${gameSlug}/${kind}/${id}/items/${itemId}/full.json`,
        permission: 'can_edit',
      },
    },
  },
};
