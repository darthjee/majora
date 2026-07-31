/**
 * `GET`/mutation resource configuration for `pc` — mirrors the PC endpoints in
 * `docs/agents/access-control/character.md`.
 *
 * @description No restricted `collection` endpoint exists for PCs today
 *   (unlike NPCs' `/npcs/all.json`), so `collection`'s `private` points at
 *   the exact same `path`/`permission` object as `regular` — not a separate
 *   object. `single`'s `private` variant (`/pcs/:id/full.json`) is
 *   `CharacterEdit` (the PC's owning player, that game's GameMaster, or a
 *   superuser) — a character-level `can_edit`, resolved via
 *   `AccessStore.ensureCharacterPermissions`.
 *
 *   `PATCH.single` mirrors `GET.single`'s `regular`/`private` shape: `private` → `.../full.json`
 *   (`can_edit`, the full editor), accepting the full field set. `regular` → the plain
 *   `.../:id.json` path, accepting the reduced player-writable field set (`name`, `role`,
 *   `public_description`, `money`, `links`); reachable by any player of the PC's game or any
 *   Staff account (issue #865), same as the equivalent NPC endpoint. Money edits (including the
 *   quick-edit modal) go through this `regular` PATCH endpoint too (issue #915) — there is no
 *   separate money-only endpoint anymore.
 *
 *   `POST.single` (photo upload init, `.../photo_upload.json`) is a single, un-branched variant
 *   (`CharacterPhotoUpload` — broader than character-level `can_edit`, granting any player of the
 *   PC's game too), so `regular`/`private` point at the exact same object. The actual permission
 *   is enforced server-side, same as every other mutation here.
 *
 *   `PATCH.photo` (photo set-roles, `.../photos/:photo_id/set.json`) needs a `photo_id` param in
 *   addition to `id` — kept under its own quantity-type-like key (`'photo'`), following
 *   `treasureConfig.js`'s precedent for params-dependent config, rather than overloading
 *   `single`'s shape. `CharacterEditPermission`-gated (character-level `can_edit`), so
 *   `regular`/`private` are the same object too — a caller with `can_edit` false gets a 403 from
 *   the backend regardless of which URL variant the frontend happened to pick.
 *
 *   `PATCH.photoDelete`/`DELETE.photoDelete` (issue #721, mark-then-delete photo removal,
 *   `.../photos/:photo_id.json`) also need a `photo_id` param, kept under its own quantity-type
 *   key (`'photoDelete'`) for the same reason as `'photo'` above. Gated by `can_delete_photo` — a
 *   narrower, DM/admin/staff-only permission than `photo`'s `can_edit` — so `regular`/`private`
 *   point at the same object too; the actual check is enforced server-side.
 */
const collection = { path: ({ gameSlug }) => `/games/${gameSlug}/pcs.json`, permission: null };

const patchRegular = { path: ({ gameSlug, id }) => `/games/${gameSlug}/pcs/${id}.json`, permission: null };
const patchPrivate = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/pcs/${id}/full.json`, permission: 'can_edit',
};
const photoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/pcs/${id}/photo_upload.json`, permission: null,
};
const photoSet = {
  path: ({ gameSlug, id, photoId }) => `/games/${gameSlug}/pcs/${id}/photos/${photoId}/set.json`,
  permission: 'can_edit',
};
const photoDelete = {
  path: ({ gameSlug, id, photoId }) => `/games/${gameSlug}/pcs/${id}/photos/${photoId}.json`,
  permission: 'can_delete_photo',
};

export default {
  GET: {
    collection: { regular: collection, private: collection },
    single: {
      regular: { path: ({ gameSlug, id }) => `/games/${gameSlug}/pcs/${id}.json`, permission: null },
      private: { path: ({ gameSlug, id }) => `/games/${gameSlug}/pcs/${id}/full.json`, permission: 'can_edit' },
    },
  },
  PATCH: {
    single: { regular: patchRegular, private: patchPrivate },
    photo: { regular: photoSet, private: photoSet },
    photoDelete: { regular: photoDelete, private: photoDelete },
  },
  POST: {
    single: { regular: photoUploadInit, private: photoUploadInit },
  },
  DELETE: {
    photoDelete: { regular: photoDelete, private: photoDelete },
  },
};
