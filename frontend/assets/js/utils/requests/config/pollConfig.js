/**
 * GET/mutation resource configuration for `poll` (issue #842) — the first `resourceConfig`
 * entry for this resource (unlike most other resources migrated so far, `poll` never had a
 * `GET` entry registered before this issue), covering `GameDatePoll` list/detail/vote endpoints.
 *
 * @description Every endpoint here is open to any player/DM/superuser/staff of the game (a wider
 *   audience than `GameEditPermission`, enforced entirely server-side, checked client-side by the
 *   page controllers' own `AccessStore.ensureGameAccess` gate before ever calling through), and
 *   none has a separate restricted/full variant — so every `regular`/`private` pair below points
 *   at the exact same object, mirroring `sessionConfig.js`'s `single` shape.
 *
 *   `GET.collection` (`fetchPolls`, `/games/:game_slug/polls.json`) and `GET.single`
 *   (`fetchPoll`, `/games/:game_slug/polls/:id.json`) mirror `PollClient`'s former methods of the
 *   same name. `GET.single` carries a `skipCache: true` flag (issue #842): the response is
 *   identity-gated (reflects the requester's own votes/permissions) and the poll `id` is the
 *   path's own trailing dynamic segment, so it cannot be expressed as a static
 *   `skipCacheSuffixes.js` entry the way `GET.votes`/`PUT.votes` can (see below) — `RequestStore`'s
 *   `GET` dispatch (`RequestClient#fetchResource`, via `Request#ensure`) checks this flag and
 *   forwards `X-Skip-Cache: true`, scoped narrowly to this one shape.
 *
 *   `GET.votes`/`PUT.votes` (`fetchPollVotes`/`castPollVotes`,
 *   `/games/:game_slug/polls/:id/votes.json`) share the same path — its own quantity-type key
 *   because it is neither `single` nor `collection` in this config's shape. Both skip the proxy
 *   cache automatically once `/votes.json` is added to `skipCacheSuffixes.js` (`GET`/`PUT` via the
 *   static-suffix match) — no `skipCache` flag needed here, unlike `GET.single` above.
 *
 *   `POST.collection` (`createPoll`) targets the same `/games/:game_slug/polls.json` path as
 *   `GET.collection`, kept as its own object (not a shared reference) mirroring
 *   `gameConfig.js`'s `collection`/`create` split. `PATCH.close` (`closePoll`,
 *   `/games/:game_slug/polls/:id/close.json`) gets its own quantity-type key, mirroring
 *   `GET.votes`/`PUT.votes` — every `PATCH` already skips the proxy cache unconditionally
 *   (`BaseClient`), so no suffix/flag is needed for it either.
 */
const collection = { path: ({ gameSlug }) => `/games/${gameSlug}/polls.json`, permission: null };
const single = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/polls/${id}.json`, permission: null, skipCache: true,
};
const create = { path: ({ gameSlug }) => `/games/${gameSlug}/polls.json`, permission: null };
const votes = { path: ({ gameSlug, id }) => `/games/${gameSlug}/polls/${id}/votes.json`, permission: null };
const close = { path: ({ gameSlug, id }) => `/games/${gameSlug}/polls/${id}/close.json`, permission: null };

export default {
  GET: {
    collection: { regular: collection, private: collection },
    single: { regular: single, private: single },
    votes: { regular: votes, private: votes },
  },
  POST: {
    collection: { regular: create, private: create },
  },
  PUT: {
    votes: { regular: votes, private: votes },
  },
  PATCH: {
    close: { regular: close, private: close },
  },
};
