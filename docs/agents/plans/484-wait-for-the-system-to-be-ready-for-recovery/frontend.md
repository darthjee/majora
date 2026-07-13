# Frontend Plan: Wait for the system to be ready for recovery

Main plan: [plan.md](plan.md)

## Shared contracts

- Render the waiting message via
  `Translator.t('recover_password_page.waiting_for_server')`. The
  `translator` agent is responsible for adding this key (and its
  translations) to every `frontend/assets/i18n/*.yaml` file — do not add the
  key yourself, just consume it.

## Implementation Steps

### Step 1 — Add a readiness check to `RecoverPasswordController`

In `frontend/assets/js/components/resources/account/pages/controllers/RecoverPasswordController.js`:

- Accept a `HealthClient` instance in the constructor (default
  `new HealthClient()`, same pattern `HeaderController` already uses).
- Add a method, e.g. `async waitUntilReady(setReady, delayMs = 2000)`, that:
  - Calls `this.healthClient.check()`.
  - Treats a `200` response as ready: call `setReady(true)` and stop.
  - Treats a `502` response, any other non-2xx response, or a thrown error
    (including the `AbortSignal.timeout` rejection used by `HealthClient`)
    as "not ready yet": wait `delayMs`, then try again.
  - Never sets `setReady(true)` on anything other than a `200`.
  - Keep looping until the component unmounts — accept a cancellation
    signal/flag (e.g. an object with a `cancelled` flag, or an `AbortSignal`)
    so a pending retry timer doesn't call `setReady` after unmount.

### Step 2 — Gate rendering in `RecoverPassword.jsx`

In `frontend/assets/js/components/resources/account/pages/RecoverPassword.jsx`:

- Add a `ready` state (`useState(false)`).
- In a `useEffect` that runs once on mount, call
  `controller.waitUntilReady(setReady)`, and return a cleanup function that
  marks the effect cancelled (per Step 1's cancellation mechanism) so no
  state update happens after unmount.
- Pass `ready` down to `RecoverPasswordHelper.render`.

### Step 3 — Render the waiting state in `RecoverPasswordHelper`

In `frontend/assets/js/components/resources/account/pages/helpers/RecoverPasswordHelper.jsx`:

- Before the existing `success`/form branching, add: when `!state.ready`,
  render a waiting element (e.g. a simple message using
  `Translator.t('recover_password_page.waiting_for_server')`) instead of the
  form or the success view.
- Keep the existing `success` and form branches unchanged once `ready` is
  `true`.

### Step 4 — Tests

- `frontend/specs/assets/js/components/resources/account/pages/controllers/RecoverPasswordControllerSpec.js`:
  add cases for `waitUntilReady` — resolves immediately on `200`, retries on
  `502`, retries on a thrown/timeout error, and stops retrying once
  cancelled.
- `frontend/specs/assets/js/components/resources/account/pages/RecoverPasswordSpec.js`:
  cover that the form does not render until `ready` becomes `true`.
- `frontend/specs/assets/js/components/resources/account/pages/helpers/RecoverPasswordHelperSpec.js`:
  cover the new waiting branch.

## Files to Change

- `frontend/assets/js/components/resources/account/pages/controllers/RecoverPasswordController.js` — add `waitUntilReady`, accept `HealthClient`.
- `frontend/assets/js/components/resources/account/pages/RecoverPassword.jsx` — add `ready` state and mount effect.
- `frontend/assets/js/components/resources/account/pages/helpers/RecoverPasswordHelper.jsx` — add waiting-state rendering branch.
- `frontend/specs/assets/js/components/resources/account/pages/controllers/RecoverPasswordControllerSpec.js` — new specs for `waitUntilReady`.
- `frontend/specs/assets/js/components/resources/account/pages/RecoverPasswordSpec.js` — cover gated rendering.
- `frontend/specs/assets/js/components/resources/account/pages/helpers/RecoverPasswordHelperSpec.js` — cover waiting branch.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- `HealthClient.check()` already aborts after 5s via `AbortSignal.timeout`,
  which rejects the returned promise — this rejection is one of the "not
  ready yet" cases to catch, alongside an explicit `502` status.
- Keep the retry delay short (a couple of seconds) so the page starts
  showing the form promptly once the backend is actually up, without
  hammering `/health.json`.
