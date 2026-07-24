/**
 * GET resource configuration for `treasure` — a `collection` entry covering both a game's own
 * catalog of `Treasure`s (`kind: 'game'`, mirrors
 * `docs/agents/access-control/game-treasure.md`/`treasure.md`) and a PC's or NPC's held
 * `CharacterTreasure`s (`kind: 'pcs'|'npcs'`, mirrors
 * `docs/agents/access-control/character-treasure.md`) — genuinely different backing shapes, but
 * the same regular-vs-`all.json`-on-`can_edit` pattern, so `collection` picks the right path
 * family from `kind` the same way `itemConfig.js`'s `single`/`collection` already do — plus a
 * `single` entry for both the standalone (non-game-scoped) treasure detail endpoint and the
 * game-scoped one (mirrors `docs/agents/access-control/treasure.md`/`game-treasure.md`).
 *
 * @description `collection` params: `gameSlug` and, for the character-owned kinds only, `id`
 *   (character id); `kind` is `'game'`, `'pcs'`, or `'npcs'`. For `kind: 'game'`, the DM-only
 *   `/games/:game_slug/treasures/all.json` is gated by `GameEditPermission` (game-level
 *   `can_edit`, resolved via `AccessStore.ensureGamePermissions`). For the character-owned
 *   kinds, the restricted variant is *not* symmetric between them: a DM-only
 *   `/games/:game_slug/npcs/:id/treasures/all.json` exists only for NPCs, gated the same
 *   game-level way — PCs have no restricted collection endpoint at all, so for `kind === 'pcs'`,
 *   both `path` and `permission` resolve to the exact same value as `regular`.
 *
 *   `single` params: `id` (treasure id) and, optionally, `gameSlug`. `GET /treasures/:id.json`
 *   (no `gameSlug`) is `AllowAny` with no separate restricted/full variant — a treasure's edit
 *   rights are resolved separately via `/treasures/:id/permissions.json`
 *   (`AccessStore.ensureTreasurePermissions`), not embedded in this response. `GET
 *   /games/:game_slug/treasures/:id.json` (`gameSlug` given, used by the per-game treasure edit
 *   page) is likewise `AllowAny` for `GET` — edit rights for that route are enforced inline on
 *   `PATCH`, not via a separate restricted read variant — so for both shapes, `private` points at
 *   the exact same `path`/`permission` object as `regular`, mirroring `sessionConfig.js`'s
 *   `single` shape.
 *
 *   `ownedCollection` params: `gameSlug`, `kind` (`'pcs'`/`'npcs'`), and `id` (character id) —
 *   always the plain `.../treasures.json` path for both kinds, with `private` pointing at the
 *   exact same `path`/`permission` object as `regular` (never elevating to `all.json`), unlike
 *   `collection`'s own `kind: 'npcs'` branch above. Added by issue #811 so the treasure exchange
 *   modal's Sell tab (a character's *owned* treasures, not the game's catalog) can go through
 *   `RequestStore` too, without silently starting to include hidden treasures for a DM viewing an
 *   NPC's sell list the way `collection`'s elevation would.
 *
 *   `POST.collection` (create) params: `gameSlug` (game-catalog create, when given) or none at
 *   all (standalone create) — branches on the *presence* of `gameSlug`, not a `kind` param (there
 *   is no character-owned treasure creation route, unlike `item`/`document`), mirroring
 *   `singlePath`'s own `gameSlug ? ... : ...` idiom. Game-catalog create
 *   (`POST /games/:game_slug/treasures.json`) is `GameEditPermission`-gated (game-level
 *   `can_edit`); standalone create (`POST /treasures.json`) is superuser-or-staff-gated with no
 *   `can_edit` concept at all — since neither branch has a separate restricted/full variant,
 *   `regular`/`private` point at the exact same object regardless (the page-level
 *   `AccessStore.ensureStaffOrSuperUser()`/`ensureGamePermissions()` redirect gates already do the
 *   real, page-level gating; this config only resolves the URL).
 *
 *   `PATCH.single` (update) reuses `singlePath` unchanged — confirmed by
 *   `TreasureClient#updateTreasure`/`#updateGameTreasure` both hitting the exact same plain path
 *   today, with permission enforced entirely server-side (superuser/staff, or that game's
 *   GameMaster for an exclusive treasure, on the global route; `GameEditPermission` on the
 *   game-scoped route) — no restricted/full variant exists for either, so `regular`/`private`
 *   point at the exact same object.
 *
 *   `POST.single` (photo-upload init, `/treasures/:id/photo_upload.json`) is standalone-only —
 *   confirmed against `backend/games/urls/treasures.py`, there is no game-scoped treasure
 *   photo-upload route. `regular`/`private` point at the exact same object; permission (superuser/
 *   staff, or the owning game's GameMaster when `treasure.game_id` is set) is enforced
 *   server-side.
 *
 *   `POST.acquire`/`POST.buy`/`POST.remove`/`POST.sell` (issue #844) back the treasure exchange
 *   modal's Acquire/Buy/Remove/Sell tabs. Params: `gameSlug`, `kind` (`'pcs'`/`'npcs'`), `id`
 *   (character id). `acquire`/`buy` each have a DM/admin-only `private` endpoint that also accepts
 *   a hidden `Treasure`, so a DM acting on a PC's or NPC's behalf doesn't 404; `remove`/`sell` have
 *   no such counterpart today (confirmed in `CharacterClient.js`), so their `regular`/`private`
 *   point at the exact same object, mirroring `single`/`ownedCollection`'s own un-branched
 *   treatment above. Callers pass `variantName` explicitly (from an already-loaded
 *   `canEdit`/`gameCanEdit`) rather than relying on live permission resolution, so `permission`
 *   here is documentation-only.
 *
 *   `POST.link` (issue #842) backs the Add Treasure modal's link-existing-catalog-treasure
 *   submit (`POST /games/:game_slug/treasures/link.json`), distinct from `POST.collection`'s
 *   game-catalog *create*. Params: `gameSlug`. `GameEditPermission`-gated (DM-only) on the
 *   backend with no non-DM variant at all, so `regular`/`private` point at the exact same object,
 *   mirroring `collection`'s own `create` shape — `permission: 'can_edit'` here is
 *   documentation-only, the same way it is on `create`.
 */
/**
 * Build the regular (everyone-readable) game-catalog treasure collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @returns {string} The endpoint path.
 */
const gamePath = ({ gameSlug }) => `/games/${gameSlug}/treasures.json`;

/**
 * Build the full (editor-only) game-catalog treasure collection path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @returns {string} The endpoint path.
 */
const gameFullPath = ({ gameSlug }) => `/games/${gameSlug}/treasures/all.json`;

/**
 * Build the regular (everyone-readable) character-owned treasure collection path, shared by
 * both character kinds.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const characterPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/treasures.json`;

/**
 * Build the standalone or game-scoped single-treasure path, depending on whether `gameSlug` is
 * given.
 *
 * @param {object} params - Concrete params.
 * @param {string} [params.gameSlug] - Game slug, when fetching the game-scoped detail endpoint.
 * @param {string|number} params.id - Treasure id.
 * @returns {string} The endpoint path.
 */
const singlePath = ({ gameSlug, id }) => (
  gameSlug ? `/games/${gameSlug}/treasures/${id}.json` : `/treasures/${id}.json`
);

const single = { path: singlePath, permission: null };
const ownedCollection = { path: characterPath, permission: null };

/**
 * Build the game-catalog or standalone treasure-creation path, depending on whether `gameSlug` is
 * given.
 *
 * @param {object} params - Concrete params.
 * @param {string} [params.gameSlug] - Game slug, when creating a game-exclusive treasure.
 * @returns {string} The endpoint path.
 */
const createPath = ({ gameSlug } = {}) => (gameSlug ? `/games/${gameSlug}/treasures.json` : '/treasures.json');

const create = { path: createPath, permission: 'can_edit' };
const patch = { path: singlePath, permission: null };
const photoUploadInit = { path: ({ id }) => `/treasures/${id}/photo_upload.json`, permission: null };

/**
 * Build the player-facing treasure-acquire path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const acquirePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/treasures/acquire.json`;

/**
 * Build the DM/admin-only treasure-acquire path (also accepts a hidden `Treasure`).
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const acquireAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/treasures/acquire/all.json`;

/**
 * Build the player-facing treasure-buy path.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const buyPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/treasures/buy.json`;

/**
 * Build the DM/admin-only treasure-buy path (also accepts a hidden `Treasure`).
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const buyAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/treasures/buy/all.json`;

/**
 * Build the (sole, player-facing) treasure-remove path — no DM/admin-only counterpart exists.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const removeExchangePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/treasures/remove.json`;

/**
 * Build the (sole, player-facing) treasure-sell path — no DM/admin-only counterpart exists.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const sellPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/treasures/sell.json`;

const removeExchange = { path: removeExchangePath, permission: null };
const sell = { path: sellPath, permission: null };
const link = { path: ({ gameSlug }) => `/games/${gameSlug}/treasures/link.json`, permission: 'can_edit' };

export default {
  GET: {
    collection: {
      regular: {
        path: (params) => (params.kind === 'game' ? gamePath(params) : characterPath(params)),
        permission: null,
      },
      private: {
        path: (params) => {
          if (params.kind === 'game') {
            return gameFullPath(params);
          }

          return params.kind === 'npcs'
            ? `/games/${params.gameSlug}/npcs/${params.id}/treasures/all.json`
            : characterPath(params);
        },
        permission: (params) => (params.kind === 'game' || params.kind === 'npcs' ? 'can_edit' : null),
      },
    },
    single: { regular: single, private: single },
    ownedCollection: { regular: ownedCollection, private: ownedCollection },
  },
  PATCH: {
    single: { regular: patch, private: patch },
  },
  POST: {
    collection: { regular: create, private: create },
    single: { regular: photoUploadInit, private: photoUploadInit },
    acquire: {
      regular: { path: acquirePath, permission: null },
      private: { path: acquireAllPath, permission: 'can_edit' },
    },
    buy: {
      regular: { path: buyPath, permission: null },
      private: { path: buyAllPath, permission: 'can_edit' },
    },
    remove: { regular: removeExchange, private: removeExchange },
    sell: { regular: sell, private: sell },
    link: { regular: link, private: link },
  },
};
