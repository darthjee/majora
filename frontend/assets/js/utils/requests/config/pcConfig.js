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
 *   (`can_edit`, the full editor). Unlike NPC, no PC counterpart to `npc_player_update` exists on
 *   the backend today — `regular` still points at the plain `.../:id.json` path (which only
 *   supports `GET` today, so a mutation there 404s/405s), reserved for a future issue that adds
 *   player-writable PC updates; no PC caller reaches it today since the edit page redirects away
 *   when `!can_edit`.
 *
 *   `PUT.single` (money, `.../money.json`) and `POST.single` (photo upload init,
 *   `.../photo_upload.json`) are both single, un-branched variants (`CharacterMoneyEdit`/
 *   `CharacterPhotoUpload` respectively — broader than character-level `can_edit`, granting any
 *   player of the PC's game too), so `regular`/`private` point at the exact same object; which
 *   one `resolveVariant` picks makes no difference since both resolve to the same path. The
 *   actual permission is enforced server-side, same as every other mutation here.
 *
 *   `PATCH.photo` (photo set-roles, `.../photos/:photo_id/set.json`) needs a `photo_id` param in
 *   addition to `id` — kept under its own quantity-type-like key (`'photo'`), following
 *   `treasureConfig.js`'s precedent for params-dependent config, rather than overloading
 *   `single`'s shape. `CharacterEditPermission`-gated (character-level `can_edit`), so
 *   `regular`/`private` are the same object too — a caller with `can_edit` false gets a 403 from
 *   the backend regardless of which URL variant the frontend happened to pick.
 */
const collection = { path: ({ gameSlug }) => `/games/${gameSlug}/pcs.json`, permission: null };

const patchRegular = { path: ({ gameSlug, id }) => `/games/${gameSlug}/pcs/${id}.json`, permission: null };
const patchPrivate = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/pcs/${id}/full.json`, permission: 'can_edit',
};
const money = { path: ({ gameSlug, id }) => `/games/${gameSlug}/pcs/${id}/money.json`, permission: null };
const photoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/pcs/${id}/photo_upload.json`, permission: null,
};
const photoSet = {
  path: ({ gameSlug, id, photoId }) => `/games/${gameSlug}/pcs/${id}/photos/${photoId}/set.json`,
  permission: 'can_edit',
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
  },
  PUT: {
    single: { regular: money, private: money },
  },
  POST: {
    single: { regular: photoUploadInit, private: photoUploadInit },
  },
};
