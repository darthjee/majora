/**
 * GET/PATCH/POST resource configuration for `faction` (issue #812) — a game-scoped, name+photo
 * entity, closer to `sourceConfig.js`'s shape than `possessionConfig.js`'s: `Faction` has **no**
 * hidden/restricted concept at all, so there is no separate `/all.json`/`/full.json` variant for
 * either `GET` endpoint, and `regular`/`private` point at the exact same path object everywhere.
 *
 * @description `collection`/`single` params: `gameSlug` and, for `single`, `id` (the `Faction`'s
 *   own id). `resolveVariant.js` always reads `config.private.permission`, so `private` must
 *   still be present even though it's never actually selected (`permission: null` never grants).
 *
 *   `PATCH.single` (update) is **DM/staff only**, gated server-side by the shared `check_game_edit`
 *   helper (mirroring `GameItem`'s own `PATCH`, per the permissions correction documented in
 *   `docs/agents/plans/812-add-factions/plan.md`'s "Shared contracts" section) — `permission:
 *   'can_edit'` here mirrors `possessionConfig.js`'s own `PATCH.single` shape.
 *
 *   `POST.collection` (create) and `POST.single` (photo-upload init) are both gated by the
 *   broader `regular` (staff+player) tier server-side (`backend/permissions/config/game_faction/
 *   endpoints.yml`), not a plain `can_edit` boolean — `RequestStore`'s `permission` field only
 *   expresses simple `can_edit`-style checks, so `permission: null` here is documentation-only,
 *   mirroring how `sourceConfig.js` treats its own staff-gated-server-side-only endpoints. The
 *   real client-side gate lives on the "Create Faction" button/page instead (via
 *   `AccessStore.ensureGamePermissions`'s `can_create_faction`).
 */
const collection = { path: ({ gameSlug }) => `/games/${gameSlug}/factions.json`, permission: null };
const single = { path: ({ gameSlug, id }) => `/games/${gameSlug}/factions/${id}.json`, permission: null };
const update = { path: ({ gameSlug, id }) => `/games/${gameSlug}/factions/${id}.json`, permission: 'can_edit' };
const create = { path: ({ gameSlug }) => `/games/${gameSlug}/factions.json`, permission: null };
const photoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/factions/${id}/photo_upload.json`,
  permission: null,
};

export default {
  GET: {
    collection: { regular: collection, private: collection },
    single: { regular: single, private: single },
  },
  PATCH: {
    single: { regular: update, private: update },
  },
  POST: {
    collection: { regular: create, private: create },
    single: { regular: photoUploadInit, private: photoUploadInit },
  },
};
