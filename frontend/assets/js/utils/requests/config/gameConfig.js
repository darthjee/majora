/**
 * `GET`/mutation resource configuration for `game` — mirrors `GET /games.json` and
 * `GET /games/:game_slug.json` (see `docs/agents/access-control/game.md`).
 *
 * @description Both `GET` endpoints are `AllowAny` and there is no separate
 *   restricted/private variant for either quantity type today, so `private`
 *   points at the exact same `path`/`permission` object as `regular` — not a
 *   separate object — for both `collection` and `single`.
 *
 *   `POST.collection` (game creation, `/games.json`, issue #844) requires no `can_edit` concept —
 *   any authenticated user may create a game — so `regular`/`private` point at the exact same
 *   object; permission enforced entirely server-side.
 *
 *   `PATCH.single` (game update, `/games/:game_slug.json`, issue #844) is `GameEditPermission`-
 *   gated (game-level `can_edit`) with no restricted/full variant, so `regular`/`private` point at
 *   the exact same object.
 *
 *   `POST.single` (photo-upload init, `/games/:game_slug/photo_upload.json`, issue #844) is a
 *   single, un-branched variant, same as every other resource's photo-upload-init entry —
 *   permission enforced server-side.
 */
const collection = { path: () => '/games.json', permission: null };
const single = { path: ({ gameSlug }) => `/games/${gameSlug}.json`, permission: null };
const create = { path: () => '/games.json', permission: null };
const patch = { path: ({ gameSlug }) => `/games/${gameSlug}.json`, permission: null };
const photoUploadInit = {
  path: ({ gameSlug }) => `/games/${gameSlug}/photo_upload.json`, permission: null,
};

export default {
  GET: {
    collection: { regular: collection, private: collection },
    single: { regular: single, private: single },
  },
  POST: {
    collection: { regular: create, private: create },
    single: { regular: photoUploadInit, private: photoUploadInit },
  },
  PATCH: {
    single: { regular: patch, private: patch },
  },
};
