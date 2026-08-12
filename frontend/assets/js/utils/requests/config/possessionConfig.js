/**
 * GET/PATCH/POST resource configuration for `possession` (issue #1074) — a much simpler analog
 * of `itemConfig.js`'s `'game'`-kind entries: `GamePossession` is a game-level-only resource (no
 * PC/NPC ownership, tracked separately in #1076), so there is no `kind` branching, and no
 * `acquire`/`remove`/`summary`/`availableCollection` quantity-types exist at all.
 *
 * @description `collection`/`single` params: `gameSlug` and, for `single`, `id` (the
 *   `GamePossession`'s own id). The `private` variant of each (`/possessions/all.json`,
 *   `/possessions/:id/full.json`) is gated by game-level `can_edit`
 *   (`AccessStore.ensureGamePermissions`, `GameEditPermission` on the backend), resolved via the
 *   `possession` entry in `RequestPermissionResolvers.js` — mirroring `item`'s own `'game'`-kind
 *   resolution exactly.
 *
 *   `PATCH.single` (update) reuses `single`'s own path, gated inline by `GameEditPermission` on
 *   the backend (dm/admin/superuser only, no staff bypass) — mirroring `GameItem`'s own `PATCH`,
 *   confirmed against `docs/agents/access-control/game-item.md`. No separate `/full.json`
 *   counterpart exists for `PATCH`, so `regular`/`private` point at the exact same object.
 *
 *   `POST.collection` (create) and `POST.single` (photo-upload init) are both gated by
 *   `GamePossessionCreatePermission`/`GamePossessionPhotoUploadPermission` on the backend — a
 *   strict superset of plain `can_edit` (staff and any player of the game, per
 *   `backend/permissions/config/game_possession/endpoints.yml`, identical to
 *   `game_item/endpoints.yml`'s own `create`/`photo_upload` grants). No restricted/full variant
 *   exists for either, so `regular`/`private` point at the exact same object in both cases.
 */
export default {
  GET: {
    collection: {
      regular: { path: ({ gameSlug }) => `/games/${gameSlug}/possessions.json`, permission: null },
      private: { path: ({ gameSlug }) => `/games/${gameSlug}/possessions/all.json`, permission: 'can_edit' },
    },
    single: {
      regular: { path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}.json`, permission: null },
      private: {
        path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}/full.json`,
        permission: 'can_edit',
      },
    },
  },
  PATCH: {
    single: {
      regular: { path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}.json`, permission: 'can_edit' },
      private: { path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}.json`, permission: 'can_edit' },
    },
  },
  POST: {
    collection: {
      regular: { path: ({ gameSlug }) => `/games/${gameSlug}/possessions.json`, permission: 'can_edit' },
      private: { path: ({ gameSlug }) => `/games/${gameSlug}/possessions.json`, permission: 'can_edit' },
    },
    single: {
      regular: {
        path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}/photo_upload.json`,
        permission: null,
      },
      private: {
        path: ({ gameSlug, id }) => `/games/${gameSlug}/possessions/${id}/photo_upload.json`,
        permission: null,
      },
    },
  },
};
