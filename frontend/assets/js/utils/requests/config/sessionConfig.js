/**
 * GET resource configuration for `session` — mirrors `GET
 * /games/:game_slug/sessions/:id.json` (see
 * `docs/agents/access-control/game-session.md`).
 *
 * @description The detail endpoint is `AllowAny` and there is no separate
 *   restricted/private variant (a session's edit rights mirror its game's,
 *   resolved separately via the existing `/games/:game_slug/permissions.json`
 *   endpoint, not embedded in this response) — so `private` points at the
 *   exact same `path`/`permission` object as `regular`. No `collection` entry
 *   is configured: the past/future/unscheduled list endpoints are not fetched
 *   through `RequestStore` by this issue.
 */
const single = { path: ({ gameSlug, id }) => `/games/${gameSlug}/sessions/${id}.json`, permission: null };

export default {
  GET: {
    single: { regular: single, private: single },
  },
};
