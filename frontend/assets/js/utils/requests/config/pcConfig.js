/**
 * GET resource configuration for `pc` — mirrors the PC endpoints in
 * `docs/agents/access-control/character.md`.
 *
 * @description No restricted `collection` endpoint exists for PCs today
 *   (unlike NPCs' `/npcs/all.json`), so `collection`'s `private` points at
 *   the exact same `path`/`permission` object as `regular` — not a separate
 *   object. `single`'s `private` variant (`/pcs/:id/full.json`) is
 *   `CharacterEdit` (the PC's owning player, that game's GameMaster, or a
 *   superuser) — a character-level `can_edit`, resolved via
 *   `AccessStore.ensureCharacterPermissions`.
 */
const collection = { path: ({ gameSlug }) => `/games/${gameSlug}/pcs.json`, permission: null };

export default {
  GET: {
    collection: { regular: collection, private: collection },
    single: {
      regular: { path: ({ gameSlug, id }) => `/games/${gameSlug}/pcs/${id}.json`, permission: null },
      private: { path: ({ gameSlug, id }) => `/games/${gameSlug}/pcs/${id}/full.json`, permission: 'can_edit' },
    },
  },
};
