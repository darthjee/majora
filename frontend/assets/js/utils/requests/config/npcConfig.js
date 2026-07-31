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
 *   `NpcPlayerEditPermission` — any player of the game, plus `staff`, in addition to `can_edit`),
 *   wired through `RequestStore.mutate` (issue #847). Money edits (including the quick-edit
 *   modal) go through this `regular` PATCH endpoint too (issue #915) — there is no separate
 *   money-only endpoint anymore.
 *
 *   `POST.single` (photo upload init, `.../photo_upload.json`) is a single, un-branched variant
 *   (`CharacterPhotoUpload` — not exactly character-level `can_edit`), so `regular`/`private`
 *   point at the exact same object; the actual permission is enforced server-side, same as every
 *   other mutation here.
 *
 *   `PATCH.photo` (photo set-roles, `.../photos/:photo_id/set.json`) needs a `photo_id` param in
 *   addition to `id` — kept under its own quantity-type-like key (`'photo'`), following
 *   `treasureConfig.js`'s precedent for params-dependent config, rather than overloading
 *   `single`'s shape. `CharacterEditPermission`-gated (character-level `can_edit`), so
 *   `regular`/`private` are the same object too.
 *
 *   `PATCH.photoDelete`/`DELETE.photoDelete` (issue #721, mark-then-delete photo removal,
 *   `.../photos/:photo_id.json`) also need a `photo_id` param, kept under its own quantity-type
 *   key (`'photoDelete'`) for the same reason as `'photo'` above. Gated by `can_delete_photo` — a
 *   narrower, DM/admin/staff-only permission than `photo`'s `can_edit` — so `regular`/`private`
 *   point at the same object too; the actual check is enforced server-side.
 *
 *   `POST.collection` (NPC creation) mirrors `PATCH.single`'s `regular`/`private` shape: `regular`
 *   → `.../npcs.json`, gated by the new `can_create_npc` permission (issue #868's
 *   `NpcPlayerCreatePermission` — dm/admin/superuser/staff/any player of the game) and accepting
 *   the narrower `NpcPlayerCreateSerializer` field set server-side; `private` → the new
 *   `.../npcs/full.json`, gated by game-level `can_edit` (the DM/admin/superuser full creator),
 *   accepting the full field set.
 */
const patchRegular = { path: ({ gameSlug, id }) => `/games/${gameSlug}/npcs/${id}.json`, permission: null };
const patchPrivate = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/npcs/${id}/full.json`, permission: 'can_edit',
};
const photoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/npcs/${id}/photo_upload.json`, permission: null,
};
const photoSet = {
  path: ({ gameSlug, id, photoId }) => `/games/${gameSlug}/npcs/${id}/photos/${photoId}/set.json`,
  permission: 'can_edit',
};
const photoDelete = {
  path: ({ gameSlug, id, photoId }) => `/games/${gameSlug}/npcs/${id}/photos/${photoId}.json`,
  permission: 'can_delete_photo',
};
const createRegular = { path: ({ gameSlug }) => `/games/${gameSlug}/npcs.json`, permission: 'can_create_npc' };
const createPrivate = {
  path: ({ gameSlug }) => `/games/${gameSlug}/npcs/full.json`, permission: 'can_edit',
};

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
    photoDelete: { regular: photoDelete, private: photoDelete },
  },
  POST: {
    single: { regular: photoUploadInit, private: photoUploadInit },
    collection: { regular: createRegular, private: createPrivate },
  },
  DELETE: {
    photoDelete: { regular: photoDelete, private: photoDelete },
  },
};
