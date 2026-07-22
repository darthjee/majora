/**
 * GET resource configuration for `npc` — mirrors the NPC endpoints in
 * `docs/agents/access-control/character.md`.
 *
 * @description `collection`'s `private` variant (`/npcs/all.json`) is gated
 *   by `GameEditPermission` on the backend — a *game*-level `can_edit`, not
 *   the character-level one — so `RequestPermissionResolvers` resolves it via
 *   `AccessStore.ensureGamePermissions`, not `ensureCharacterPermissions`.
 *   `single`'s `private` variant (`/npcs/:id/full.json`) is `CharacterEdit`
 *   (character-level `can_edit`), resolved via `ensureCharacterPermissions`.
 */
export default {
  GET: {
    collection: {
      regular: { path: ({ gameSlug }) => `/games/${gameSlug}/npcs.json`, permission: null },
      private: { path: ({ gameSlug }) => `/games/${gameSlug}/npcs/all.json`, permission: 'can_edit' },
    },
    single: {
      regular: { path: ({ gameSlug, id }) => `/games/${gameSlug}/npcs/${id}.json`, permission: null },
      private: { path: ({ gameSlug, id }) => `/games/${gameSlug}/npcs/${id}/full.json`, permission: 'can_edit' },
    },
  },
};
