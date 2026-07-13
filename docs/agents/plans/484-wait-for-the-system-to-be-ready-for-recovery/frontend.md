# Frontend Plan: Wait for the system to be ready for recovery

Main plan: [plan.md](plan.md)

## Shared contracts

- Backend exposes `GET /ready.json`: `200` (or any status other than `502`) means "ready";
  `502` or a client-side timeout means "not ready — retry."
- `/ready.json` must be requested with the `X-Skip-Cache: true` request header, driven by
  adding it to `frontend/assets/js/client/config/skipCacheEndpoints.js`.
- Loading message uses i18n key `recover_password_page.waiting_for_server` (added by the
  translator agent, see [translator.md](translator.md)) — do not hardcode the string.

## Implementation Steps

### Step 1 — Register `/ready.json` for skip-cache

Add `'/ready.json'` to the `Set` in
`frontend/assets/js/client/config/skipCacheEndpoints.js`, alongside the existing
`/health.json` entry.

### Step 2 — Add a `ReadyClient`

Create `frontend/assets/js/client/ReadyClient.js`, mirroring `HealthClient.js`:

```js
import BaseClient from './BaseClient.js';

export default class ReadyClient extends BaseClient {
  check() {
    const signal = AbortSignal.timeout(5000);

    return this.request('/ready.json', {
      headers: { Accept: 'application/json' },
      signal,
    });
  }
}
```

Add a matching spec `frontend/specs/client/ReadyClient.spec.js` (mirror the existing
`HealthClient` spec), asserting it requests `/ready.json` with the expected headers/timeout.

### Step 3 — Add polling logic to the recover-password controller

Extend `RecoverPasswordController`
(`frontend/assets/js/components/resources/account/pages/controllers/RecoverPasswordController.js`)
with readiness-polling behavior, independent from `handleSubmit`/`AuthClient`:

- New constructor param for a `ReadyClient` instance (default `new ReadyClient()`), alongside
  the existing `AuthClient` default — follow the same override-for-testability pattern already
  used for `client`.
- A method, e.g. `startReadinessPoll(setIsReady)`, that:
  - Immediately calls `ReadyClient#check()`.
  - On a `502` response, or a thrown error (network failure or the 5s `AbortSignal` timeout),
    schedules another attempt after 5 seconds and keeps looping indefinitely.
  - On any other response, calls `setIsReady(true)` and stops polling.
  - Returns a cleanup/stop function so the `RecoverPassword` component can cancel the loop on
    unmount (mirror `HeaderController#stopHealthCheck`'s cleanup pattern).

### Step 4 — Wire the polling into the page component

In `RecoverPassword.jsx`:
- Add `const [isReady, setIsReady] = useState(false);`.
- Start the poll on mount via `useEffect` (call `controller.startReadinessPoll(setIsReady)`,
  return the stop function for cleanup), mirroring `Header.jsx`'s
  `startHealthCheck`/`stopHealthCheck` `useEffect` pattern.
- Render a loading state instead of the form while `!isReady`.

### Step 5 — Render the loading state

In `RecoverPasswordHelper.jsx`, add a loading branch (parallel to the existing
`#renderSuccess`/`#renderForm` branches):

```jsx
{!state.isReady
  ? RecoverPasswordHelper.#renderLoading()
  : state.status === 'success'
    ? RecoverPasswordHelper.#renderSuccess()
    : RecoverPasswordHelper.#renderForm(state, handlers)}
```

```jsx
static #renderLoading() {
  return <p>{Translator.t('recover_password_page.waiting_for_server')}</p>;
}
```

Pass `isReady` through `state` from `RecoverPassword.jsx`.

### Step 6 — Specs

Add/extend Jasmine specs for:
- `RecoverPasswordController`: readiness polling starts not-ready, retries on `502`, retries
  on timeout/thrown error, becomes ready on a non-`502` response, and the returned stop
  function halts further polling.
- `RecoverPassword`/`RecoverPasswordHelper`: renders the loading state before ready, renders
  the form once ready, does not render the form while not ready even if `status` would
  otherwise allow it.

Use Jasmine's clock mocking (already used elsewhere for `HeaderController`'s interval-based
tests, if present) to avoid real 5-second waits in tests.

## Files to Change

- `frontend/assets/js/client/config/skipCacheEndpoints.js` — add `/ready.json`.
- `frontend/assets/js/client/ReadyClient.js` — new client.
- `frontend/specs/client/ReadyClient.spec.js` — new spec.
- `frontend/assets/js/components/resources/account/pages/controllers/RecoverPasswordController.js` — add readiness-polling method.
- `frontend/assets/js/components/resources/account/pages/RecoverPassword.jsx` — wire polling into the component lifecycle.
- `frontend/assets/js/components/resources/account/pages/helpers/RecoverPasswordHelper.jsx` — add loading render branch.
- Relevant spec files under `frontend/specs/` for the controller, page, and helper.

## CI Checks

- `frontend/`: `npm run coverage` (CI job: `jasmine`)
- `frontend/`: ESLint (CI job: `frontend-checks`)

## Notes

- Keep this polling mechanism fully independent of `HealthClient`/`HeaderController` — do not
  modify the header's existing health-check behavior.
- The 5-second retry interval is a fixed delay, not exponential backoff, and retries
  indefinitely (no max-attempts/error state), per issue #484.
