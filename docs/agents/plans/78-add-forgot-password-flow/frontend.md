# Frontend Plan: Add forgot password flow

Main plan: [plan.md](plan.md)

## Shared contracts

- `POST /users/recover.json` `{email}` -> always `200 {"sent": true}`.
- `POST /users/reset-password.json` `{token, password}` -> `200 {"reset": true}` / `400 {"error": "Invalid or expired token"}`.
- Recovery page route: `/recover-password`, registered in `HashRouteResolver`, reading `token` from the hash query string via the existing `hashQueryParams` helper.
- The recovery page does not use `AuthStorage`/the stored auth token — it is a logged-out flow driven entirely by the URL's `token` param.

## Implementation Steps

### Step 1 — Extend `AuthClient`
Add to `frontend/assets/js/client/AuthClient.js`:
```js
recoverPassword(email) {
  return fetch('/users/recover.json', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

resetPassword(token, password) {
  return fetch('/users/reset-password.json', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
}
```

### Step 2 — Login modal "forgot password" mode
Extend the existing `LoginModal`/`LoginModalHelper`/`LoginModalController` trio (`frontend/assets/js/components/elements/LoginModal.jsx` + `helpers/LoginModalHelper.jsx` + `controllers/LoginModalController.js`) rather than creating a parallel modal:
- `LoginModal.jsx`: add `mode` state (`'login' | 'recover'`, default `'login'`), `email` state, and `recoverySent` state. Add handlers `onForgotPasswordClick` (sets `mode` to `'recover'`), `onEmailChange`, and `onRecoverSubmit` (calls a new `controller.handleRecoverSubmit(email)`). Reset `mode`/`email`/`recoverySent` in `handleClear` (called on close).
- `LoginModalController.js`: add `handleRecoverSubmit(email)` — calls `this.client.recoverPassword(email)`, and regardless of the response (the backend always returns `200 {"sent": true}`, so there is no error branch to distinguish — only a network-level catch), sets a `setRecoverySent(true)` state setter (new constructor param) so the modal can show a confirmation message. Constructor gains `setRecoverySent` alongside the existing setters.
- `LoginModalHelper.jsx`: when `state.mode === 'recover'`, render an email-only form (`Modal.Title` "Recover password", one `mb-3` block with an email `<input type="email">`, a "Send recovery email" submit button, and a "Back to login" cancel-style button switching `mode` back to `'login'`) instead of the username/password form; when `state.recoverySent` is true, replace the form with a generic confirmation message (e.g. "If that email is registered, a recovery link has been sent.") — phrased to never confirm or deny account existence, matching the backend's identical-response guarantee. In `'login'` mode, add a "Forgot password?" link below the password field, calling `handlers.onForgotPasswordClick`.

### Step 3 — Recovery page
Add a new page following the existing pages pattern (`frontend/assets/js/components/pages/Games.jsx` style — Component + Controller + Helper):
- `frontend/assets/js/components/pages/RecoverPassword.jsx` — reads the token via `Router.extractParams`/`hashQueryParams` (same mechanism `GenericClient`/`HashRouteResolver` already use for query params) from `window.location.hash`, holds `password`, `confirmPassword`, `status` (`'idle' | 'submitting' | 'success' | 'error'`) state.
- `frontend/assets/js/components/pages/controllers/RecoverPasswordController.js` — validates `password === confirmPassword` client-side before calling `AuthClient.resetPassword(token, password)`; maps the response to `status`.
- `frontend/assets/js/components/pages/helpers/RecoverPasswordHelper.jsx` — renders the password + confirm-password form (no other fields, no autofill of anything token-derived into the DOM beyond the hidden token already in the URL), a submit button, and status messaging; on `status === 'success'`, render a link back to `#/` instead of the form.

### Step 4 — Routing
In `frontend/assets/js/utils/HashRouteResolver.js`, register the new route: `this.#router.register('/recover-password', 'recoverPassword')`. In `frontend/assets/js/components/helpers/AppHelper.jsx`, add `recoverPassword: <RecoverPassword />` to the `PAGES` map and import the new page.

### Step 5 — Tests
Add specs mirroring existing conventions: updated `LoginModalSpec.js`/`LoginModalHelperSpec.js`/`LoginModalControllerSpec.js` covering the new `recover` mode and confirmation message; new `RecoverPasswordSpec.js`, `RecoverPasswordControllerSpec.js`, `RecoverPasswordHelperSpec.js`; updated `AuthClientSpec.js` for the two new methods; updated `HashRouteResolverSpec.js`/`AppHelperSpec.js` for the new route.

## Files to Change
- `frontend/assets/js/client/AuthClient.js` — add `recoverPassword`, `resetPassword`.
- `frontend/assets/js/components/elements/LoginModal.jsx` — add recover mode state/handlers.
- `frontend/assets/js/components/elements/helpers/LoginModalHelper.jsx` — render recover-mode form + confirmation.
- `frontend/assets/js/components/elements/controllers/LoginModalController.js` — add `handleRecoverSubmit`.
- `frontend/assets/js/components/pages/RecoverPassword.jsx` — new.
- `frontend/assets/js/components/pages/controllers/RecoverPasswordController.js` — new.
- `frontend/assets/js/components/pages/helpers/RecoverPasswordHelper.jsx` — new.
- `frontend/assets/js/utils/HashRouteResolver.js` — register `/recover-password`.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — add `recoverPassword` page.
- `frontend/specs/...` — new/updated specs per Step 5.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- The recovery page's confirm-password check is a UX convenience only — the backend is the source of truth for token validity and password rules; do not skip server-side validation based on the client-side match check.
