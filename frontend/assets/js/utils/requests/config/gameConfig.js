/**
 * GET resource configuration for `game` — mirrors `GET /games.json` and
 * `GET /games/:game_slug.json` (see `docs/agents/access-control/game.md`).
 *
 * @description Both endpoints are `AllowAny` and there is no separate
 *   restricted/private variant for either quantity type today, so `private`
 *   points at the exact same `path`/`permission` object as `regular` — not a
 *   separate object — for both `collection` and `single`.
 */
const collection = { path: () => '/games.json', permission: null };
const single = { path: ({ gameSlug }) => `/games/${gameSlug}.json`, permission: null };

export default {
  GET: {
    collection: { regular: collection, private: collection },
    single: { regular: single, private: single },
  },
};
