/**
 * GET resource configuration for `treasure` — a `collection` entry covering both a game's own
 * catalog of `Treasure`s (`kind: 'game'`, mirrors
 * `docs/agents/access-control/game-treasure.md`/`treasure.md`) and a PC's or NPC's held
 * `CharacterTreasure`s (`kind: 'pcs'|'npcs'`, mirrors
 * `docs/agents/access-control/character-treasure.md`) — genuinely different backing shapes, but
 * the same regular-vs-`all.json`-on-`can_edit` pattern, so `collection` picks the right path
 * family from `kind` the same way `itemConfig.js`'s `single`/`collection` already do — plus a
 * `single` entry for the standalone (non-game-scoped) treasure detail endpoint (mirrors
 * `docs/agents/access-control/treasure.md`).
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
 *   `single` params: `id` (treasure id). `GET /treasures/:id.json` is
 *   `AllowAny` with no separate restricted/full variant — a treasure's edit
 *   rights are resolved separately via `/treasures/:id/permissions.json`
 *   (`AccessStore.ensureTreasurePermissions`), not embedded in this
 *   response — so `private` points at the exact same `path`/`permission`
 *   object as `regular`, mirroring `sessionConfig.js`'s `single` shape.
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

const single = { path: ({ id }) => `/treasures/${id}.json`, permission: null };

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
  },
};
