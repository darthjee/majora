# Plan: Refactor frontend to backend client (issue #81)

Single agent: **frontend**. No backend changes needed — this is a frontend-only
centralization of HTTP request handling.

## Context

Today the frontend has two client modules, both calling raw `fetch` directly
and duplicating the `X-Skip-Cache` header logic at each call site:

- `frontend/assets/js/client/AuthClient.js` — 7 methods, 4 of which
  (`login`, `logout`, `status`, `setLanguagePreference`) manually set
  `X-Skip-Cache: 1`; 3 (`sendTestEmail`, `recoverPassword`, `resetPassword`)
  don't.
- `frontend/assets/js/client/GenericClient.js` — `fetch`, `fetchIndex`,
  `post`, `patch`, all going through a private `#request` that calls `fetch`
  directly, never setting `X-Skip-Cache`.

No direct `fetch()` calls exist outside these two modules — every controller
already goes through one of these clients. The refactor is contained to
`frontend/assets/js/client/`.

## Solution

### 1. `frontend/assets/js/client/config/skipCacheEndpoints.js` (new)

A `Set` of endpoint pathnames (no query string) that must always send
`X-Skip-Cache: 1`, preserving exactly the current behavior:

```js
export default new Set([
  '/users/login.json',
  '/users/logout.json',
  '/users/status.json',
  '/users/language.json',
]);
```

Do not add `sendTestEmail`/`recoverPassword`/`resetPassword` endpoints —
they don't set the header today and this refactor must not change runtime
behavior, only centralize it.

### 2. `frontend/assets/js/client/BaseClient.js` (new)

Common fetch wrapper used by both `AuthClient` and `GenericClient`:

```js
import SKIP_CACHE_ENDPOINTS from './config/skipCacheEndpoints.js';

export default class BaseClient {
  async request(path, { method = 'GET', headers = {}, body } = {}) {
    const pathname = path.split('?')[0];
    const finalHeaders = { ...headers };

    if (SKIP_CACHE_ENDPOINTS.has(pathname)) {
      finalHeaders['X-Skip-Cache'] = '1';
    }

    return fetch(path, {
      method,
      headers: finalHeaders,
      body,
    });
  }
}
```

- Splitting on `?` before the Set lookup is required because `GenericClient`
  builds paths with query strings (e.g. `/games/{slug}/pcs.json?per_page=...`).
- `body` is passed through as-is (already serialized by the caller) to avoid
  changing either client's existing serialization behavior.

### 3. `frontend/assets/js/client/AuthClient.js` (refactor)

- `export default class AuthClient extends BaseClient`.
- Replace each method's direct `fetch(...)` call with
  `this.request(path, { method, headers, body })`, keeping each method's
  existing `Authorization`/`Content-Type`/`Accept` header construction and
  `JSON.stringify(body)` call exactly as today — only the `X-Skip-Cache`
  header and the `fetch` call itself move into `BaseClient`.
- Remove the now-dead manual `X-Skip-Cache: 1` lines from the 4 methods that
  had them; the header is now added automatically by `BaseClient.request`.
- Keep all method signatures and return values (`response.json()` parsing
  etc.) unchanged.

### 4. `frontend/assets/js/client/GenericClient.js` (refactor)

- `export default class GenericClient extends BaseClient`.
- Replace the private `#request(path, options, originalPath)` body's direct
  `fetch` call with `this.request(path, options)`, keeping the existing
  `!response.ok` error-throwing logic in `#request` (it should call
  `this.request` and then check `response.ok`, same as today).
- `fetch`, `fetchIndex`, `post`, `patch` keep their current signatures and
  URL-building (`#buildUrl`) — only the underlying call changes.

### 5. Specs

- `frontend/specs/assets/js/client/AuthClientSpec.js` — keep
  `spyOn(globalThis, 'fetch')`; assertions on headers/body/method stay the
  same since runtime behavior is unchanged. Update only if the exact
  call shape to `fetch` changes (e.g. header object construction order).
- `frontend/specs/assets/js/client/GenericClientSpec.js` — same: behavior
  unchanged, so existing assertions should keep passing; adjust only if
  needed.
- Add a new `frontend/specs/assets/js/client/BaseClientSpec.js` covering:
  - request to a configured endpoint includes `X-Skip-Cache: 1`.
  - request to a non-configured endpoint does not include the header.
  - a path with a query string is matched against the Set by pathname only.

## Acceptance criteria

- All backend HTTP calls still go through `AuthClient` or `GenericClient`,
  which now both extend `BaseClient`.
- `X-Skip-Cache: 1` is added by a single shared place
  (`BaseClient.request` + `skipCacheEndpoints.js`), not per call site.
- No behavior change for any existing endpoint (same headers, same bodies,
  same response handling).
- `npm test` / lint pass in `frontend/`.
