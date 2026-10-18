/**
 * GET/mutation resource configuration for `apiToken` (issue #1605) — the owner's own scoped API
 * tokens, backing the `#/account/api_tokens` page.
 *
 * @description Every endpoint here is owner-only and session-only: the backend scopes every
 *   query to the logged-in user, and a scoped token can never manage tokens itself. None has a
 *   separate restricted/full variant, so every `regular`/`private` pair below points at the exact
 *   same object with `permission: null`, mirroring `staffUserConfig.js`. The resource is
 *   resolver-less: it has no entry in `RequestPermissionResolvers.js`, so the default
 *   `NO_PERMISSIONS()` applies and no `AccessStore` call is made.
 *
 *   `GET.collection` (`/account/api_tokens.json`) lists the user's tokens (metadata only, newest
 *   first). `GET.options` (`/account/api_tokens/options.json`) returns the scopes and reachable
 *   games the create form offers. `POST.collection` creates a token, `PATCH.single` renames it
 *   and `DELETE.single` revokes it (`/account/api_tokens/:id.json`).
 *
 *   The `POST.collection` response carries the plain token secret: it must never be cached or
 *   stored. `RequestStore.mutate` never caches responses, and callers read the secret straight
 *   into React state, then purge `apiToken` and re-fetch the list. Both `GET` paths are also in
 *   `client/config/skipCacheEndpoints.js`, so the proxy cache is always skipped.
 */
const collection = { path: () => '/account/api_tokens.json', permission: null };
const options = { path: () => '/account/api_tokens/options.json', permission: null };
const create = { path: () => '/account/api_tokens.json', permission: null };
const single = { path: ({ id }) => `/account/api_tokens/${id}.json`, permission: null };

export default {
  GET: {
    collection: { regular: collection, private: collection },
    options: { regular: options, private: options },
  },
  POST: {
    collection: { regular: create, private: create },
  },
  PATCH: {
    single: { regular: single, private: single },
  },
  DELETE: {
    single: { regular: single, private: single },
  },
};
