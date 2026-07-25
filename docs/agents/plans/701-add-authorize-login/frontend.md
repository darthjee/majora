# Frontend Plan: Add authorize login

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the exact endpoint paths, request
bodies, response shapes, and status codes this plan consumes. In particular: the polling
`GET` returns a real login `token` on `202`, to be stored exactly like a normal login's
token; the create `POST` response shape is identical for known/unknown usernames (nothing
frontend-visible distinguishes them, by design).

## Implementation Steps

### Step 1 — `AuthClient` additions

`frontend/assets/js/client/AuthClient.js` — add:
- `createAuthorizationRequest(username)` → `this.postJson('/users/authorization_requests.json', null, { username })`.
- `pollAuthorizationRequest(uuid, token, signal)` → `GET /users/authorization_requests/${uuid}.json`
  with header `X-Authorize-Token: ${token}` (extend `buildHeaders`/`request` similarly to
  how `status(token, signal)` already threads a signal through `getJson`).
- `listAuthorizationRequests(token, { page, perPage })` → `GET /account/authorization_requests.json`
  (reuse the existing pagination query-param pattern, see `docs/agents/pagination.md`).
- `denyAuthorizationRequest(token, uuid)` → `PATCH /account/authorization_requests/${uuid}/deny.json`.
- `authorizeAuthorizationRequest(token, uuid, password)` → `PATCH /account/authorization_requests/${uuid}/authorize.json`, body `{ password }`.

### Step 2 — Skip-cache wiring for the two new `GET`s

`POST`/`PATCH` already auto-skip-cache via `BaseClient#shouldSkipCache`. The two `GET`s
need explicit wiring:
- `/account/authorization_requests.json` — exact path, add it to
  `frontend/assets/js/client/config/skipCacheEndpoints.js`'s `Set` (same as
  `/users/account.json`).
- `/users/authorization_requests/<uuid>.json` — the uuid is the path segment
  immediately before `.json`, so neither the exact-match `SKIP_CACHE_ENDPOINTS` Set nor
  the suffix-match `SKIP_CACHE_SUFFIXES` Set (which matches literal suffixes like
  `/access.json`) can express it. Add a small prefix-based check to `BaseClient.js`,
  mirroring the existing `ACTIVITY_ENDPOINT_PREFIXES`/`#shouldRegisterActivity` pattern:
  a new `frontend/assets/js/client/config/skipCachePrefixes.js` exporting a `Set` with
  `'/users/authorization_requests/'`, and a branch in `#shouldSkipCache` that checks
  `[...SKIP_CACHE_PREFIXES].some((prefix) => pathname.startsWith(prefix))`.

### Step 3 — Polling controller

New `frontend/assets/js/utils/polling/AuthorizationRequestPoller.js` (or alongside the
login modal's controllers if that fits the codebase's granularity better), modeled on
`frontend/assets/js/components/common/header/controllers/HeaderController.js`'s
`startHealthCheck`/`stopHealthCheck`/`#pollHealth` shape: `setInterval` every 5s calling
`AuthClient#pollAuthorizationRequest`, retrying transient errors, stopping and resolving
once a terminal status (`approved`+token / `denied` / `expired` / network-side "not
found") is reached. Also stop client-side once the request's own `expiration` timestamp
(returned at creation) has passed, purely as a UX nicety — the server is always the
authority (see backend's lazy-expiration handling), so this is just to stop polling a
dead request instead of waiting for a `422`.

### Step 4 — Login modal: new "authorize" mode

- `frontend/assets/js/components/resources/account/LoginModal.jsx` — add `'authorize'`
  alongside the existing `'login'`/`'recover'` `mode` states, plus a radio control to
  choose `'login'` vs `'authorize'` (the issue calls for a radio between password and
  device-authorize login — recover stays reachable the same way it is today, from within
  the password mode).
- `controllers/LoginModalController.js` — add a submit path for `authorize` mode: calls
  `AuthClient#createAuthorizationRequest(username)`, then hands off to the Step 3 poller;
  on the poller resolving with a token, follow the exact same success path
  `#handleSuccess` already uses for password login (`AuthStorage.setToken`, `AuthEvents.emit(true)`,
  `onSuccess`) — do not fork this logic, since per the shared contract the token is a
  normal login token.
- `helpers/LoginModalHelper.jsx` — new `#renderAuthorize` branch: login-field-only form,
  then a "waiting for approval" view (spinner/status text) while polling, with the
  existing `#renderLogin`/`#renderRecover` branches as the pattern to follow.

### Step 5 — Authorization requests page

- New route: add `['/account/authorization_requests', 'accountAuthorizationRequests']`
  to `frontend/assets/js/utils/routing/HashRouteResolver.js`'s `ROUTES`, and
  `accountAuthorizationRequests: <AuthorizationRequests />` in
  `frontend/assets/js/components/helpers/AppHelper.jsx`.
- New menu item in `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`'s
  "My account" `NavDropdown` (~line 102-121): another `NavDropdown.Item
  href="#/account/authorization_requests"` alongside `my_account`/`my-games`.
- New page component `frontend/assets/js/components/resources/account/pages/AuthorizationRequests.jsx`
  + `controllers/AuthorizationRequestsController.js` (fetch via
  `AuthClient#listAuthorizationRequests`, pagination params via
  `HashRouteResolver().getPaginationParams()`, same shape as
  `StaffUsersController.js`) + `helpers/AuthorizationRequestsHelper.jsx` (renders
  `<Table columns={...} rows={...} renderActions={...} />` +
  `<Pagination .../>`, following `StaffUsersHelper.jsx`'s structure).
- Status → badge variant map (new `frontend/assets/js/components/common/list_types/AuthorizationRequestStatusBadges.js`,
  same shape as `CharacterStatusBadges.js`): `open` → success/green, `approved` → primary/blue,
  `logged` → a distinct darker-blue variant (check whether `Badge.jsx`'s variant set
  already has one, e.g. Bootstrap's `info`/`dark` combos — otherwise a small custom class
  may be needed), `denied` → danger/red, `expired` → secondary/gray.
- Confirm modals: two new modal+helper pairs (or one parametrized by action), following
  `SlainConfirmModal.jsx`/`helpers/SlainConfirmModalHelper.jsx`'s thin-component +
  static-render-helper pattern:
  - Deny confirm: confirm/cancel, calls `AuthClient#denyAuthorizationRequest`.
  - Authorize confirm: confirm/cancel + a password field, calls
    `AuthClient#authorizeAuthorizationRequest`.
  - **Both modals must display the row's `ip` and `browser` fields prominently** (already
    present in the list response per the shared contract) — this is the security
    review's finding that the approving human needs this context to tell a legitimate
    request from a phishing one; don't let it get dropped as "just a confirm dialog."

## Files to Change

- `frontend/assets/js/client/AuthClient.js` — 5 new methods.
- `frontend/assets/js/client/BaseClient.js` — prefix-based skip-cache branch.
- `frontend/assets/js/client/config/skipCacheEndpoints.js` — add list endpoint.
- `frontend/assets/js/client/config/skipCachePrefixes.js` — new file.
- `frontend/assets/js/utils/polling/AuthorizationRequestPoller.js` — new.
- `frontend/assets/js/components/resources/account/LoginModal.jsx`,
  `controllers/LoginModalController.js`, `helpers/LoginModalHelper.jsx` — new "authorize" mode.
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — new route.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — new route mapping.
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — new menu item.
- `frontend/assets/js/components/resources/account/pages/AuthorizationRequests.jsx` +
  `controllers/AuthorizationRequestsController.js` +
  `helpers/AuthorizationRequestsHelper.jsx` — new page.
- `frontend/assets/js/components/common/list_types/AuthorizationRequestStatusBadges.js` — new.
- New deny/authorize confirm modal + helper files (naming to match
  `SlainConfirmModal.jsx` convention, under the same `resources/account/` area).
- Mirrored Jasmine specs under `frontend/specs/` for every file above (the codebase
  mirrors `assets/js/` under `specs/` 1:1).

## CI Checks

- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`).
- `frontend`: `npm run lint` (CI job: `frontend-checks`).
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until
  [translator.md](translator.md)'s keys exist in both `en.yaml` and `pt.yaml`.

## Notes

- Do not implement any of this through `RequestStore`/`resourceConfig.js` — the issue
  explicitly calls this out, and the exploration confirmed `pollConfig.js` is an
  unrelated `RequestStore` resource (`GameDatePoll` in-game voting), not a general polling
  utility — a standalone `setInterval`-based controller (Step 3) is the right shape.
- `logged` needs its own badge color distinct from `approved` per the issue (a "darker
  shade of blue") — check `Badge.jsx`'s existing variant palette before assuming a new
  CSS class is needed.
