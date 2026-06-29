# Frontend Plan: Add Healthcheck

Main plan: [plan.md](plan.md)

## Shared contracts

The backend exposes:

- `GET /health.json` → HTTP 200, body `{"status": "ok"}`
- No authentication required (no `Authorization` header needed)

The frontend must poll this endpoint every **30 000 ms** for the lifetime of the page
session.

## Implementation Steps

### Step 1 — Add a `HealthClient`

Create `frontend/assets/js/client/HealthClient.js` extending `BaseClient`:

```js
import BaseClient from './BaseClient.js';

export default class HealthClient extends BaseClient {
  check() {
    return this.request('/health.json', {
      headers: { Accept: 'application/json' },
    });
  }
}
```

### Step 2 — Update `HeaderController` to start a health-check interval

In `frontend/assets/js/components/elements/controllers/HeaderController.js`:

- Accept an optional `healthClient` parameter (default `new HealthClient()`).
- Add a `startHealthCheck(intervalMs = 30000)` method that calls
  `this.healthClient.check()` every `intervalMs` milliseconds via `setInterval` and
  stores the interval ID so it can be cancelled later.
- Add a `stopHealthCheck()` method that calls `clearInterval` on the stored ID.
- For now, silent failures are acceptable (same pattern as `checkStatus`). Any
  connectivity indicator UX is left to a future issue.

### Step 3 — Wire polling in the `Header` component

In `frontend/assets/js/components/elements/Header.jsx`:

- Call `controller.startHealthCheck()` inside the `useEffect` (after `checkStatus()`).
- Return `controller.stopHealthCheck()` from the cleanup function so the interval is
  cleared when the component unmounts.

### Step 4 — Write specs

`frontend/specs/assets/js/client/HealthClientSpec.js`:
- Confirm `check()` calls `fetch('/health.json', ...)` with `Accept: application/json`.

`frontend/specs/assets/js/components/elements/controllers/HeaderControllerSpec.js`
(extend existing file):
- `startHealthCheck` calls `healthClient.check()` at the given interval.
- `stopHealthCheck` clears the interval so `check()` is no longer called.

`frontend/specs/assets/js/components/elements/HeaderSpec.js`
(extend existing file):
- Confirm `startHealthCheck` is called on mount and `stopHealthCheck` on unmount.

## Files to Change

- `frontend/assets/js/client/HealthClient.js` — new file, health check HTTP client
- `frontend/specs/assets/js/client/HealthClientSpec.js` — new file, client spec
- `frontend/assets/js/components/elements/controllers/HeaderController.js` — add
  `startHealthCheck` / `stopHealthCheck` methods and `healthClient` dependency
- `frontend/specs/assets/js/components/elements/controllers/HeaderControllerSpec.js` —
  extend with health-check specs
- `frontend/assets/js/components/elements/Header.jsx` — wire polling in `useEffect`
- `frontend/specs/assets/js/components/elements/HeaderSpec.js` — extend with mount/unmount
  polling specs

## CI Checks

- `frontend/`: `docker-compose run majora_fe npm test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- The 30-second interval should be started once on component mount and stopped on unmount
  to avoid memory leaks in long-lived sessions.
- No visual indicator is added in this issue; silent polling only.
- If the issue description intended "every 30" to mean something other than 30 seconds,
  clarify before implementing.
