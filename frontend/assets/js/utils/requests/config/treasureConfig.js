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
};
