# Frontend Plan: Add login modal

Main plan: [plan.md](plan.md)

## Shared contracts

- Calls `POST /users/login.json` `{username, password}` -> `{token}` / `401`.
- Calls `POST /users/logout.json` with `Authorization: Token <token>` -> `204`.
- Calls `GET /users/status.json` with `Authorization: Token <token>` (if any) -> `{logged_in, username?}`.
- All three requests send `X-Skip-Cache: 1`.
- Token is persisted in `localStorage` under key `authToken`.
- Dispatches `window` `CustomEvent('auth:changed', { detail: { loggedIn } })` after login, logout, and the page-load status check.

## Implementation Steps

### Step 1 — Auth client
Add `frontend/assets/js/client/AuthClient.js` (pattern from `../oak/frontend/assets/js/client/LoginModalClient.js`, adapted to this endpoint contract):
- `login(username, password)` -> `fetch('/users/login.json', { method: 'POST', headers: {...}, body: JSON.stringify({ username, password }) })`.
- `logout(token)` -> `fetch('/users/logout.json', { method: 'POST', headers: { ...'Authorization': 'Token ' + token } })`.
- `status(token)` -> `fetch('/users/status.json', { headers: token ? { Authorization: 'Token ' + token } : {} })`.
- All three always set `Accept: application/json` and `X-Skip-Cache: 1`; `login`/`logout` also set `Content-Type: application/json` as needed.

### Step 2 — Auth event bus helper
Add `frontend/assets/js/utils/AuthEvents.js` with two static helpers: `emit(loggedIn)` (dispatches `new CustomEvent('auth:changed', { detail: { loggedIn } })` on `window`) and `subscribe(handler)` / `unsubscribe(handler)` (thin wrappers over `window.addEventListener('auth:changed', handler)`), mirroring the existing `hashchange` listener pattern in `AppController.buildEffect()`.

### Step 3 — Login modal (mirrors `../oak/frontend`)
Add, following the same Component/Helper/Controller split already used in `oak` and in this repo's `HeaderHelper`:
- `frontend/assets/js/components/elements/LoginModal.jsx` — stateful component (`username`, `password`, `incorrect`, `error` state), same shape as oak's `LoginModal.jsx` but fields named `username`/`password` to match this repo's endpoint contract.
- `frontend/assets/js/components/elements/helpers/LoginModalHelper.jsx` — pure render of the Bootstrap `Modal` with username/password fields, adapted from oak's `LoginModalHelper.jsx` (this repo doesn't have oak's `Alert`/`LabeledInput` elements — use plain Bootstrap form markup, e.g. `Modal.Body` with two `<div className="mb-3">` blocks containing `<label>`/`<input className="form-control">`, and a `<div className="alert alert-danger">` shown conditionally for `incorrect`/`error`).
- `frontend/assets/js/components/elements/controllers/LoginModalController.js` — same responsibilities as oak's controller (submit, clear, handle response), using `AuthClient.login`, storing the returned token in `localStorage.authToken` on success, and calling `AuthEvents.emit(true)` instead of a generic `onSuccess` callback (still accept an optional `onSuccess` for closing the modal).

### Step 4 — Header wiring
Convert `Header.jsx`/`HeaderHelper.jsx` from the current static `Login` placeholder into a stateful component:
- `Header.jsx` becomes stateful: holds `loggedIn`/`showModal` state, an effect that calls `AuthClient.status(localStorage.authToken)` on mount and sets `loggedIn` from the result (emitting `AuthEvents.emit(result.logged_in)`), and subscribes to `auth:changed` (via `AuthEvents.subscribe`) to keep `loggedIn` in sync if some other component triggers a change.
- Add a small `HeaderController.js` (or inline handlers in `Header.jsx`, whichever keeps `Header.jsx` thin per this repo's Component/Helper/Controller convention already used elsewhere) handling: `onLoginClick` (open modal), `onLogoffClick` (call `AuthClient.logout(token)`, clear `localStorage.authToken`, emit `auth:changed` with `false`).
- `HeaderHelper.render` gains parameters for `loggedIn`, `showModal`, and the handlers above; replaces the static `<span data-testid="auth-placeholder">Login</span>` with a real `<a>`/`<button>` toggling between "Login" and "Logoff" text based on `loggedIn`, and renders `<LoginModal show={showModal} onClose={...} onSuccess={...} />`.

### Step 5 — Tests
Add Jasmine specs mirroring oak's spec structure (`spec/components/elements/LoginModal_spec.js`, `spec/components/elements/controllers/LoginModalController_spec.js`, `spec/components/elements/helpers/LoginModalHelper_spec.js`, `spec/client/AuthClient_spec.js`, `spec/utils/AuthEvents_spec.js`) plus updated specs for `Header`/`HeaderHelper` covering: modal opens on Login click, successful login swaps to Logoff and emits `auth:changed`, Logoff clears state and emits `auth:changed`, and the mount-time status check applies the returned `logged_in` value.

## Files to Change
- `frontend/assets/js/client/AuthClient.js` — new.
- `frontend/assets/js/utils/AuthEvents.js` — new.
- `frontend/assets/js/components/elements/LoginModal.jsx` — new.
- `frontend/assets/js/components/elements/helpers/LoginModalHelper.jsx` — new.
- `frontend/assets/js/components/elements/controllers/LoginModalController.js` — new.
- `frontend/assets/js/components/elements/Header.jsx` — rewrite as stateful.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — extend render signature, replace placeholder.
- `frontend/specs/...` — new/updated specs per Step 5.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- `oak`'s `Alert`/`LabeledInput` helper components don't exist in this repo — Step 3 inlines equivalent plain markup rather than porting those components, to avoid pulling in unrelated UI primitives this issue doesn't ask for.
