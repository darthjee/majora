/**
 * `GET`/mutation resource configuration for `npc` — mirrors the NPC endpoints in
 * `docs/agents/access-control/character.md`.
 *
 * @description `collection`'s `private` variant (`/npcs/all.json`) is gated
 *   by `GameEditPermission` on the backend — a *game*-level `can_edit`, not
 *   the character-level one — so `RequestPermissionResolvers` resolves it via
 *   `AccessStore.ensureGamePermissions`, not `ensureCharacterPermissions`.
 *   `single`'s `private` variant (`/npcs/:id/full.json`) is `CharacterEdit`
 *   (character-level `can_edit`), resolved via `ensureCharacterPermissions`.
 *
 *   `PATCH.single` mirrors `GET.single`'s `regular`/`private` shape: `private` → `.../full.json`
 *   (`can_edit`, the DM/admin full editor); `regular` → the plain `.../:id.json` path, which
 *   already accepts a narrower player-writable `PATCH` on the backend (`npc_player_update`,
 *   `NpcPlayerEditPermission` — any player of the game, in addition to `can_edit`), wired today
 *   as `CharacterClient#updateNpcAsPlayer`.
 *
 *   `PUT.single` (money, `.../money.json`) and `POST.single` (photo upload init,
 *   `.../photo_upload.json`) are both single, un-branched variants (`CharacterMoneyEdit`/
 *   `CharacterPhotoUpload` respectively — neither is exactly character-level `can_edit`), so
 *   `regular`/`private` point at the exact same object; the actual permission is enforced
 *   server-side, same as every other mutation here.
 *
 *   `PATCH.photo` (photo set-roles, `.../photos/:photo_id/set.json`) needs a `photo_id` param in
 *   addition to `id` — kept under its own quantity-type-like key (`'photo'`), following
 *   `treasureConfig.js`'s precedent for params-dependent config, rather than overloading
 *   `single`'s shape. `CharacterEditPermission`-gated (character-level `can_edit`), so
 *   `regular`/`private` are the same object too.
 *
 *   `POST.collection` (NPC creation, `/games/:game_slug/npcs.json`) is `GameEditPermission`-gated
 *   (game-level `can_edit`) with no restricted/full variant, so `regular`/`private` point at the
 *   exact same object.
 */
const patchRegular = { path: ({ gameSlug, id }) => `/games/${gameSlug}/npcs/${id}.json`, permission: null };
const patchPrivate = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/npcs/${id}/full.json`, permission: 'can_edit',
};
const money = { path: ({ gameSlug, id }) => `/games/${gameSlug}/npcs/${id}/money.json`, permission: null };
const photoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/npcs/${id}/photo_upload.json`, permission: null,
};
const photoSet = {
  path: ({ gameSlug, id, photoId }) => `/games/${gameSlug}/npcs/${id}/photos/${photoId}/set.json`,
  permission: 'can_edit',
};
const create = { path: ({ gameSlug }) => `/games/${gameSlug}/npcs.json`, permission: 'can_edit' };

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
  PATCH: {
    single: { regular: patchRegular, private: patchPrivate },
    photo: { regular: photoSet, private: photoSet },
  },
  PUT: {
    single: { regular: money, private: money },
  },
  POST: {
    single: { regular: photoUploadInit, private: photoUploadInit },
    collection: { regular: create, private: create },
  },
};
