# Frontend Plan: Use custom cache hash for some restricted endpoints

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes the `cache_token` field backend adds to `POST /users/login.json` and `GET /users/status.json` responses (see [backend.md](backend.md)).
- Produces the `X-Cache-Token` header the proxy's new hasher reads (see [proxy.md](proxy.md)) — sent on every request once the token is known; omitted before that (e.g. the very first bootstrap call).

## Implementation Steps

### Step 1 — Extend `AuthStorage`

`frontend/assets/js/utils/auth/AuthStorage.js` currently holds only the auth token in a module-level variable. Add a parallel in-memory slot for the cache token, mirroring the existing shape exactly:

```javascript
let _token = null;
let _cacheToken = null;

export default class AuthStorage {
  static getToken() {
    return _token;
  }

  static setToken(token) {
    _token = token;
  }

  static clearToken() {
    _token = null;
  }

  static getCacheToken() {
    return _cacheToken;
  }

  static setCacheToken(cacheToken) {
    _cacheToken = cacheToken;
  }

  static clearCacheToken() {
    _cacheToken = null;
  }
}
```

### Step 2 — Wire the header into `BaseClient`

`frontend/assets/js/client/BaseClient.js`'s `buildHeaders` is the single place every `getJson`/`postJson`/`patchJson`/`putJson`/`deleteJson` helper routes through. Add the `X-Cache-Token` header there, reading from `AuthStorage` directly (consistent with how the rest of the header set is built):

```javascript
buildHeaders(token, extraHeaders = {}) {
  const cacheToken = AuthStorage.getCacheToken();
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(cacheToken ? { 'X-Cache-Token': cacheToken } : {}),
    ...extraHeaders,
  };
}
```

Confirm `BaseClient.js` doesn't already avoid importing `AuthStorage` directly for architectural reasons (check its existing imports) — if it does, thread the cache token through as an explicit parameter the same way `token` already is instead.

### Step 3 — Persist `cache_token` at the same call sites `token` is persisted

`AuthStorage.setToken(...)` is called at three sites — mirror each with `AuthStorage.setCacheToken(...)`:

- `frontend/assets/js/components/resources/account/controllers/LoginModalController.js:178`
- `frontend/assets/js/components/resources/account/pages/controllers/RegisterController.js:59`
- `frontend/assets/js/components/common/header/controllers/HeaderController.js:117` (status/bootstrap response)

And mirror the one `AuthStorage.clearToken()` call site with `AuthStorage.clearCacheToken()`:

- `frontend/assets/js/components/common/header/controllers/HeaderController.js:182` (logout)

### Step 4 — Tests

Extend the existing Jasmine specs for `AuthStorage`, `BaseClient`, `LoginModalController`, `RegisterController`, and `HeaderController` to cover the new cache-token get/set/clear behavior and the `X-Cache-Token` header — following each spec file's existing structure and naming conventions.

## Files to Change

- `frontend/assets/js/utils/auth/AuthStorage.js` — add cache-token get/set/clear
- `frontend/assets/js/client/BaseClient.js` — add `X-Cache-Token` header in `buildHeaders`
- `frontend/assets/js/components/resources/account/controllers/LoginModalController.js` — persist `cache_token`
- `frontend/assets/js/components/resources/account/pages/controllers/RegisterController.js` — persist `cache_token`
- `frontend/assets/js/components/common/header/controllers/HeaderController.js` — persist + clear `cache_token`
- Corresponding Jasmine spec files for each of the above (existing `*.spec.js` alongside each source file, following this repo's convention)

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- `RegisterController.js:59` mints a `cache_token` right at registration, before the account may even be approved — confirm this is fine (harmless, per backend's `get_or_create` semantics) or whether it should wait until first approved-login/status instead.
- No new UI surface — this is entirely plumbing (headers/in-memory storage), so no i18n/translation work is expected.
