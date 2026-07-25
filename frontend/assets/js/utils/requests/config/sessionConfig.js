/**
 * GET/mutation resource configuration for `session` — mirrors `GET
 * /games/:game_slug/sessions/:id.json` (see
 * `docs/agents/access-control/game-session.md`) plus, since issue #842, its
 * mutation routes (create/update, message post, session-scoped poll
 * proposal).
 *
 * @description The detail endpoint is `AllowAny` and there is no separate
 *   restricted/private variant (a session's edit rights mirror its game's,
 *   resolved separately via the existing `/games/:game_slug/permissions.json`
 *   endpoint, not embedded in this response) — so `private` points at the
 *   exact same `path`/`permission` object as `regular`. No `collection` `GET`
 *   entry is configured: the past/future/unscheduled list endpoints are not
 *   fetched through `RequestStore` by this issue.
 *
 *   `POST.collection` (create, `permission: 'can_edit'`) and `PATCH.single`
 *   (update) are `GameEditPermission`-gated on the backend (DM-only); neither
 *   has a separate restricted/full variant, so `regular`/`private` point at
 *   the exact same object, mirroring `treasureConfig.js`'s `create`/`patch`
 *   shape. `POST.message` (session message post) and `POST.pollProposal`
 *   (session-scoped date-poll creation) are not session CRUD in the strict
 *   sense, so they get their own `resourceConfig` quantity-type keys instead
 *   of being forced into `single`/`collection`, mirroring `treasureConfig.js`'s
 *   `acquire`/`buy`/`remove`/`sell`/`link`-style sub-resource keys — both are
 *   open to any player/DM/superuser/staff of the game (enforced entirely
 *   server-side), so `regular`/`private` point at the exact same object.
 */
const single = { path: ({ gameSlug, id }) => `/games/${gameSlug}/sessions/${id}.json`, permission: null };
const create = { path: ({ gameSlug }) => `/games/${gameSlug}/sessions.json`, permission: 'can_edit' };
const patch = { path: single.path, permission: null };
const message = { path: ({ gameSlug, id }) => `/games/${gameSlug}/sessions/${id}/messages.json`, permission: null };
const pollProposal = { path: ({ gameSlug, id }) => `/games/${gameSlug}/sessions/${id}/poll.json`, permission: null };

export default {
  GET: {
    single: { regular: single, private: single },
  },
  POST: {
    collection: { regular: create, private: create },
    message: { regular: message, private: message },
    pollProposal: { regular: pollProposal, private: pollProposal },
  },
  PATCH: {
    single: { regular: patch, private: patch },
  },
};
