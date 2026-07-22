/**
 * GET resource configuration for `treasure` (a PC's or NPC's held
 * `CharacterTreasure`s) — mirrors
 * `docs/agents/access-control/character-treasure.md`. No per-treasure detail
 * endpoint is fetched this way, so only `collection` is configured.
 *
 * @description Params: `gameSlug`, `kind` (`'pcs'` or `'npcs'`), `id`
 *   (character id). Unlike `item`, the restricted variant is *not*
 *   symmetric between kinds: a DM-only `/games/:game_slug/npcs/:id/
 *   treasures/all.json` exists only for NPCs, gated by `GameEditPermission`
 *   (a *game*-level `can_edit`, resolved via `AccessStore.
 *   ensureGamePermissions`) — PCs have no restricted collection endpoint at
 *   all, so for `kind === 'pcs'`, both `path` and `permission` resolve to the
 *   exact same value as `regular`.
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
  },
};
