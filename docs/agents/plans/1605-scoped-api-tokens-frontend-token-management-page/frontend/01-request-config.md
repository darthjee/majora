# apiToken request config and skip-cache

Add the owner token endpoints as a new RequestStore resource, `apiToken`, mirroring
`staffUserConfig.js`. Each entry is a single-variant object, `{ regular: x, private: x }` (the
same object twice), with `permission: null`:

- `GET.collection` → `/account/api_tokens.json`
- `GET.options` → `/account/api_tokens/options.json`
- `POST.collection` → `/account/api_tokens.json`
- `PATCH.single` → `({ id }) => /account/api_tokens/${id}.json`
- `DELETE.single` → the same path as `PATCH.single`

Give the file a `@description` doc comment like `staffUserConfig.js`. In it, note that the
resource is owner-only, session-only and resolver-less, and that the create response carries the
secret and must never be cached.

Register `apiToken: apiTokenConfig` in `RESOURCES` in `resourceConfig.js`, and add the name to
the resource lists in the JSDoc of `resourceConfig.js` and `RequestStore.ensure`. Add `apiToken`
to the resolver-less sentence in `RequestPermissionResolvers.js` (~lines 199–206), next to
`poll`, `task`, `staffUser` and `staffCopy`. Do not add a resolver.

**Skip-cache:** the backend sets `X-Skip-Cache: true`, but the client also keeps its own skip
lists. Add `/account/api_tokens.json` and `/account/api_tokens/options.json` to
`client/config/skipCacheEndpoints.js`, and the `/account/api_tokens/` prefix to
`client/config/skipCachePrefixes.js` (it covers `/:id.json`). Follow how
`/account/authorization_requests.json` is listed. Before choosing that route, check whether
`skipCache: true` on the config variants (as in `pollConfig.js` `GET.single`) is the convention
this path should use instead.

Specs:

- `resourceConfigApiTokenSpec.js`, modelled on `resourceConfigStaffCopySpec.js`. It uses a
  `CASES` table with the 5 entries and checks `regular === private`, the path, that `permission`
  is null, and that an unconfigured type returns null.
- Extend the existing skip-cache specs, if there are any.

## Files to Change

- `frontend/assets/js/utils/requests/config/apiTokenConfig.js` (new)
- `frontend/assets/js/utils/requests/resourceConfig.js`: register the resource and update the
  JSDoc list.
- `frontend/assets/js/utils/requests/RequestStore.js`: update the JSDoc resource list.
- `frontend/assets/js/utils/requests/RequestPermissionResolvers.js`: update the resolver-less
  doc comment.
- `frontend/assets/js/client/config/skipCacheEndpoints.js` and
  `frontend/assets/js/client/config/skipCachePrefixes.js`
- `frontend/specs/assets/js/utils/requests/resourceConfigApiTokenSpec.js` (new), plus the
  skip-cache specs if they exist.
