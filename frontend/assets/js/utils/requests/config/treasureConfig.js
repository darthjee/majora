/**
 * GET resource configuration for `treasure` — a `collection` entry for a PC's
 * or NPC's held `CharacterTreasure`s (mirrors
 * `docs/agents/access-control/character-treasure.md`) plus a `single` entry
 * for the standalone (non-game-scoped) treasure detail endpoint (mirrors
 * `docs/agents/access-control/treasure.md`).
 *
 * @description `collection` params: `gameSlug`, `kind` (`'pcs'` or `'npcs'`),
 *   `id` (character id). Unlike `item`, the restricted variant is *not*
 *   symmetric between kinds: a DM-only `/games/:game_slug/npcs/:id/
 *   treasures/all.json` exists only for NPCs, gated by `GameEditPermission`
 *   (a *game*-level `can_edit`, resolved via `AccessStore.
 *   ensureGamePermissions`) — PCs have no restricted collection endpoint at
 *   all, so for `kind === 'pcs'`, both `path` and `permission` resolve to the
 *   exact same value as `regular`.
 *
 *   `single` params: `id` (treasure id). `GET /treasures/:id.json` is
 *   `AllowAny` with no separate restricted/full variant — a treasure's edit
 *   rights are resolved separately via `/treasures/:id/permissions.json`
 *   (`AccessStore.ensureTreasurePermissions`), not embedded in this
 *   response — so `private` points at the exact same `path`/`permission`
 *   object as `regular`, mirroring `sessionConfig.js`'s `single` shape.
 */
/**
 * Build the regular (everyone-readable) treasure collection path, shared by both kinds.
 *
 * @param {object} params - Concrete params.
 * @param {string} params.gameSlug - Game slug.
 * @param {string} params.kind - Character kind (`'pcs'` or `'npcs'`).
 * @param {string|number} params.id - Character id.
 * @returns {string} The endpoint path.
 */
const regularPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/treasures.json`;

const single = { path: ({ id }) => `/treasures/${id}.json`, permission: null };

export default {
  GET: {
    collection: {
      regular: { path: regularPath, permission: null },
      private: {
        path: (params) => (params.kind === 'npcs'
          ? `/games/${params.gameSlug}/npcs/${params.id}/treasures/all.json`
          : regularPath(params)),
        permission: (params) => (params.kind === 'npcs' ? 'can_edit' : null),
      },
    },
    single: { regular: single, private: single },
  },
};
