/**
 * GET/mutation resource configuration for `staffCopy` (issue #1571), the staff-only game content
 * copy endpoints.
 *
 * @description Every endpoint here is staff/superuser-only, gated client-side by
 *   `AccessStore.ensureStaffOrSuperUser()` and enforced server-side too. None has a separate
 *   restricted/full variant, so every `regular`/`private` pair points at the same object
 *   (mirroring `staffPhotoConfig.js`). All of them answer with `X-Skip-Cache`.
 *
 *   `GET.index` (`/staff/copies.json`) returns `{types}`; `GET.games` (`/staff/copies/games.json`)
 *   lists every game (not paginated); `GET.collection` (`/staff/copies/:copyType.json`) lists the
 *   copyable rows of one type (the type travels in the path, `from`/`to`/pagination in the query);
 *   `GET.links` (`/staff/copies/links.json`) lists the pending/failed links of a target game.
 *   `POST.copy` (`/staff/copies/:copyType/:id.json`) copies one row and `POST.renew`
 *   (`/staff/copies/links/:uploadId/renew.json`) renews the token of a pending/failed link.
 */
const index = { path: () => '/staff/copies.json', permission: null };
const games = { path: () => '/staff/copies/games.json', permission: null };
const collection = { path: ({ copyType }) => `/staff/copies/${copyType}.json`, permission: null };
const links = { path: () => '/staff/copies/links.json', permission: null };
const copy = { path: ({ copyType, id }) => `/staff/copies/${copyType}/${id}.json`, permission: null };
const renew = { path: ({ uploadId }) => `/staff/copies/links/${uploadId}/renew.json`, permission: null };

export default {
  GET: {
    index: { regular: index, private: index },
    games: { regular: games, private: games },
    collection: { regular: collection, private: collection },
    links: { regular: links, private: links },
  },
  POST: {
    copy: { regular: copy, private: copy },
    renew: { regular: renew, private: renew },
  },
};
