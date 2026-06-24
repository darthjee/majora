# Frontend Plan: Store the Logged State

Main plan: [plan.md](plan.md)

## Shared contracts

### `GET /users/status.json` — session-based response includes token

When the browser has a valid `sessionid` cookie and no `Authorization` header is sent, the backend returns:

```json
{
  "logged_in": true,
  "username": "alice",
  "user_id": 1,
  "settings": { "favorite_language": "en" },
  "token": "abc123..."
}
```

The frontend must read `data.token` from this response and store it in memory so that subsequent authenticated API calls (characters, game masters, etc.) can include `Authorization: Token <key>`.

### Login / Register responses — unchanged

`POST /users/login.json` still returns `{ "token": "..." }`. The token must be kept in memory (not `localStorage`) for the lifetime of the page.

### Session cookie — browser-managed, no frontend action

The `sessionid` cookie is `HttpOnly`; JavaScript cannot read it. It is set automatically by the browser on every request to the same origin. The frontend does **not** need to forward, store, or manage it.

## Implementation Steps

### Step 1 — Replace `localStorage` with in-memory storage in `AuthStorage`

Rewrite `frontend/assets/js/utils/AuthStorage.js` to use a module-level variable instead of `localStorage`:

```js
let _token = null;

export default class AuthStorage {
  static getToken() { return _token; }
  static setToken(token) { _token = token; }
  static clearToken() { _token = null; }
}
```

All callers (`LoginModalController`, `HeaderController`, character controllers, etc.) continue to use `AuthStorage.getToken()` / `AuthStorage.setToken()` / `AuthStorage.clearToken()` without change — the API surface is identical.

### Step 2 — Restore token from status response

In `frontend/assets/js/components/elements/controllers/HeaderController.js`, update `checkStatus()` to read `data.token` when present and store it via `AuthStorage.setToken`:

```js
async checkStatus() {
  try {
    const response = await this.client.status(AuthStorage.getToken());
    if (!response.ok) return;

    const data = await response.json();

    if (data.token) {
      AuthStorage.setToken(data.token);
    }

    this.setLoggedIn(Boolean(data.logged_in));
    AuthEvents.emit(Boolean(data.logged_in));
    this.#applyLanguagePreference(data);
  } catch {
    // Ignore status check failures; default unauthenticated state remains.
  }
}
```

`AuthClient.status()` already passes whatever is in `AuthStorage` as the `Authorization` header. On the first page load after a refresh, `AuthStorage.getToken()` returns `null`, so no Authorization header is sent; the backend uses the session cookie instead and returns the token in the body. After `checkStatus()` resolves, the token is in memory for subsequent calls.

### Step 3 — Update frontend specs

**`frontend/specs/assets/js/utils/AuthStorageSpec.js`**

Replace the existing localStorage-guard tests with in-memory behavior tests:

- `getToken()` returns `null` initially.
- `setToken('tok-123')` followed by `getToken()` returns `'tok-123'`.
- `clearToken()` after `setToken` makes `getToken()` return `null`.
- Verify token state does not leak between tests (reset between `it` blocks).

**`frontend/specs/assets/js/client/AuthClientSpec.js` / `HeaderControllerSpec.js`**

- Verify `checkStatus()` calls `AuthStorage.setToken` with `data.token` when the status response includes a `token` field.
- Verify `checkStatus()` does **not** call `AuthStorage.setToken` when no `token` field is present.

## Files to Change

- `frontend/assets/js/utils/AuthStorage.js` — replace `localStorage` with in-memory variable
- `frontend/assets/js/components/elements/controllers/HeaderController.js` — restore token from status response
- `frontend/specs/assets/js/utils/AuthStorageSpec.js` — update tests for in-memory behavior
- `frontend/specs/assets/js/client/AuthClientSpec.js` — add/update spec for token restoration (if `HeaderController` spec covers it, can be there instead)

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- Because `AuthStorage` is now a module singleton, its state persists for the entire page lifetime — which is exactly what is needed. A page refresh resets it to `null`, at which point `checkStatus()` re-hydrates it from the session.
- The `status()` call in `HeaderController.checkStatus()` passes `AuthStorage.getToken()` (which may be `null` on first load) — this is intentional. A `null` token means no `Authorization` header is sent, triggering the session path on the backend.
- No changes are needed to `LoginModalController`, character controllers, or any other caller of `AuthStorage` — they all continue to use `getToken()` / `setToken()` / `clearToken()` as before.
- The `logout` flow already calls `AuthStorage.clearToken()` — this clears the in-memory token. The backend also flushes the session, so both sides are consistent.
