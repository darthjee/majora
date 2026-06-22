# Frontend Plan: Add registration flow

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes `POST /users/register.json` as described in [plan.md](plan.md#shared-contracts): sends
`{name, email, password, password_confirmation}`, expects `{username, token}` on `201` (reused for
auto-login the same way `AuthClient.login` is handled today) or `{error}` on `400`.

## Implementation Steps

### Step 1 — `AuthClient.register`

Add a `register(name, email, password, passwordConfirmation)` method to
`frontend/assets/js/client/AuthClient.js`, following the existing `login`/`recoverPassword` shape:
POST to `/users/register.json` with JSON body `{ name, email, password, password_confirmation:
passwordConfirmation }`.

### Step 2 — Register page

Add a new page, mirroring the `RecoverPassword` page structure (`Register.jsx` +
`controllers/RegisterController.js` + `helpers/RegisterHelper.jsx` under
`frontend/assets/js/components/pages/`):
- Form fields: name, email, password, password confirmation.
- On submit, call `AuthClient.register(...)`. On success, store the returned token the same way the
  login flow does (reuse whatever `AuthStorage`/`AuthEvents` calls `LoginModalController.handleSubmit`
  makes on a successful login, so the header immediately reflects "logged in") and redirect to the
  home page (`window.location.hash = '/'` or equivalent already-used navigation pattern). On failure,
  show the returned `error` message in an alert (same pattern as `LoginModalHelper.#renderError`).

### Step 3 — Route registration

In `frontend/assets/js/utils/HashRouteResolver.js`, register `/users/register` → `register`, and in
`frontend/assets/js/components/helpers/AppHelper.jsx`, add `register: <Register />` to the `PAGES`
map (import the new page).

### Step 4 — Login modal link

In `frontend/assets/js/components/elements/helpers/LoginModalHelper.jsx`, add a "register" link/button
in `#renderLogin` (next to/below "forgot password") that navigates to `#/users/register` and closes
the modal (call `handlers.onClose` after setting the hash, or a new `onRegisterClick` handler wired
through `LoginModal.jsx` → `Header.jsx` the same way `onForgotPasswordClick` is wired).

### Step 5 — Header link

In `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx`, in `#renderAuthControl`'s
logged-out branch, add a second `Nav.Link`/button (`data-testid="register-control"`) pointing at
`#/users/register`, rendered alongside the existing login button.

### Step 6 — Tests

Add Jasmine specs under `frontend/specs/` mirroring the new/changed files: `AuthClient` register
call, the new `Register` page/controller/helper (success → token stored + redirect; failure → error
shown), the login-modal register link, and the header register link visibility (only when logged out).

## Files to Change
- `frontend/assets/js/client/AuthClient.js` — add `register`.
- `frontend/assets/js/components/pages/Register.jsx` (new)
- `frontend/assets/js/components/pages/controllers/RegisterController.js` (new)
- `frontend/assets/js/components/pages/helpers/RegisterHelper.jsx` (new)
- `frontend/assets/js/utils/HashRouteResolver.js` — register the `/users/register` route.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — add `register` page mapping.
- `frontend/assets/js/components/elements/helpers/LoginModalHelper.jsx` — add register link.
- `frontend/assets/js/components/elements/LoginModal.jsx` — wire register-link navigation handler.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — add register link for logged-out
  users.
- `frontend/specs/**` — new/updated specs for the above.

## CI Checks
- `frontend/`: `npm test` (CI job: `jasmine`)
- `frontend/`: `npm run lint` (CI job: `frontend-checks` — "Check JS Lint")

## Notes
- New i18n keys needed for the register page and the two new links are defined by
  [translator.md](translator.md); use those exact keys via `Translator.t(...)`.
- Reuse `AuthStorage`/`AuthEvents` exactly as the existing login success path does, so the header's
  `loggedIn` state updates without extra plumbing.
