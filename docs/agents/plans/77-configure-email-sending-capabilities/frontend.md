# Frontend Plan: Configure email sending capabilities

Main plan: [plan.md](plan.md)

## Shared contracts

- Calls `POST /users/test-email.json` with `Authorization: Token <token>` (token from `AuthStorage.getToken()`, same as `HeaderController.handleLogoffClick`). No body. No `X-Skip-Cache` needed.
- Response: `200 {"sent": true}` / `400 {"error": ...}`.
- Link only rendered when `state.loggedIn` is `true`.

## Implementation Steps

### Step 1 — Extend `AuthClient`
Add a `sendTestEmail(token)` method to `frontend/assets/js/client/AuthClient.js`:
```js
sendTestEmail(token) {
  return fetch('/users/test-email.json', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Token ${token}`,
    },
  });
}
```

### Step 2 — Header controller
Add a `handleSendTestEmailClick()` method to `frontend/assets/js/components/elements/controllers/HeaderController.js`, following the same try/catch shape as `handleLogoffClick`: call `this.client.sendTestEmail(AuthStorage.getToken())`, and surface success/failure via a new piece of state (`setTestEmailStatus`, values `null | 'sent' | 'error'`) passed in from `Header.jsx`, mirroring how `setLoggedIn`/`setShowModal` are already threaded through the constructor.

### Step 3 — Header component + render
- `Header.jsx`: add `testEmailStatus` state (`useState(null)`), pass its setter into `HeaderController`, pass `{ testEmailStatus }` and `{ onSendTestEmailClick: () => controller.handleSendTestEmailClick() }` into `HeaderHelper.render`.
- `HeaderHelper.jsx`: in `#renderAuthControl` (or a new private helper), when `state.loggedIn` is true, render an additional link/button (`data-testid="send-test-email"`) calling `handlers.onSendTestEmailClick`, alongside the existing Logoff control. Optionally render `state.testEmailStatus` feedback (e.g. "Test email sent" / "Failed to send test email") next to it.

### Step 4 — Tests
Update `frontend/specs/.../HeaderControllerSpec.js`, `HeaderHelperSpec.js`, and `HeaderSpec.js` (and add an `AuthClient` spec case) to cover: the test-email link only appears when logged in, clicking it calls `sendTestEmail` with the stored token, and both success/failure paths update `testEmailStatus` accordingly.

## Files to Change
- `frontend/assets/js/client/AuthClient.js` — add `sendTestEmail`.
- `frontend/assets/js/components/elements/controllers/HeaderController.js` — add `handleSendTestEmailClick`.
- `frontend/assets/js/components/elements/Header.jsx` — wire new state/handler.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — render the link when logged in.
- `frontend/specs/...` — updated/new specs per Step 4.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)
