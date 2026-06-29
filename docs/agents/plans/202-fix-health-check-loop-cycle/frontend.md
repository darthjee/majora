# Frontend Plan: Fix Health Check Loop Cycle

Main plan: [plan.md](plan.md)

## Shared contracts

This agent consumes: `GET /users/status.json` (when `logged_in: true`) returns `is_superuser: boolean`.
Read `data.is_superuser` in `HeaderController.checkStatus()` and propagate it to `Header` state as `isSuperUser`.

## Implementation Steps

### Step 1 — Add `/health.json` to skipCacheEndpoints

In `frontend/assets/js/client/config/skipCacheEndpoints.js`, add `'/health.json'` to the Set so that `BaseClient` automatically sends `X-Skip-Cache: 1` on every health check request.

### Step 2 — Add timeout and 502/error handling to `HealthClient.check()`

In `frontend/assets/js/client/HealthClient.js`, update `check()` to:
- Create an `AbortController` with a 5-second timeout signal (`AbortSignal.timeout(5000)`).
- Pass the signal to the fetch options.
- Return the `Response` object (callers will need to inspect it).

The existing `HealthClient` already extends `BaseClient.request()`, so the change is straightforward: add the `signal` option.

### Step 3 — Change polling interval default to 60 seconds

In `frontend/assets/js/components/elements/controllers/HeaderController.js`, change the default `intervalMs` argument of `startHealthCheck` from `30000` to `60000`.

### Step 4 — Implement `ActivityTracker` singleton

Create `frontend/assets/js/utils/ActivityTracker.js`:

```js
/**
 * Tracks the timestamp of the last user-initiated request.
 * Used to pause health-check polling during long idle periods.
 */
export default class ActivityTracker {
  static #lastActivity = null;

  /**
   * Records the current timestamp as the last activity time.
   */
  static register() {
    ActivityTracker.#lastActivity = Date.now();
  }

  /**
   * Returns the timestamp (ms since epoch) of the last registered activity,
   * or null if no activity has been registered yet.
   *
   * @returns {number|null}
   */
  static getLastActivity() {
    return ActivityTracker.#lastActivity;
  }
}
```

Allowlist of GET endpoints that also count as activity — define as a constant in the same file or a co-located config file (`frontend/assets/js/utils/config/activityEndpoints.js`):
```js
export default new Set([
  '/games.json',
]);
```
This list should include page-data GET endpoints (see issue for examples). The exact endpoints are: `/games.json`, `/games/<slug>.json`, `/games/<slug>/pcs.json`, `/games/<slug>/npcs.json`, `/games/<slug>/pcs/<id>.json`, `/games/<slug>/npcs/<id>.json`. Since these are dynamic, store them as path prefixes or patterns. A practical approach: store them as prefix strings and use `pathname.startsWith(prefix)`. For example: `'/games/'` covers all game sub-paths, and `'/games.json'` covers the list. Alternatively, match using a regex. Use whatever approach is cleanest given the BaseClient pattern (prefix comparison is simplest).

### Step 5 — Hook `ActivityTracker` into `BaseClient`

In `frontend/assets/js/client/BaseClient.js`, import `ActivityTracker` and the activity endpoints config. In the `request()` method:
- After resolving the `pathname`, call `ActivityTracker.register()` when:
  - The method is `POST`, `PATCH`, or `DELETE`, OR
  - The method is `GET` and the pathname matches one of the allowlisted activity endpoints (prefix/exact match).
- Health check requests (`/health.json`) must NOT count as activity; since they are `GET` requests, they will not match the POST/PATCH/DELETE branch. They should also be excluded from the GET allowlist.

### Step 6 — Add server status and superuser state to `Header`

In `frontend/assets/js/components/elements/Header.jsx`:
- Add `const [isSuperUser, setIsSuperUser] = useState(false);`
- Add `const [serverStatus, setServerStatus] = useState(null);` (`null` | `'up'` | `'down'`)
- Pass `setIsSuperUser` and `setServerStatus` to `HeaderController` (update constructor call signature).
- Pass `isSuperUser` and `serverStatus` in the state object to `HeaderHelper.render()`.

### Step 7 — Update `HeaderController` constructor and `checkStatus()`

In `frontend/assets/js/components/elements/controllers/HeaderController.js`:
- Add `setIsSuperUser` and `setServerStatus` constructor parameters (with `() => {}` defaults).
- In `checkStatus()`: after reading `data`, call `this.setIsSuperUser(Boolean(data.is_superuser))`.
- In `startHealthCheck()`: on each tick:
  - Check `ActivityTracker.getLastActivity()`. If the last activity was more than 30 minutes ago (or null), skip the health check request.
  - Otherwise, call `this.healthClient.check()` and await the response.
  - On success (response received): inspect `response.status`. If `502`, call `this.setServerStatus('down')`. Otherwise call `this.setServerStatus('up')`.
  - On error (network/timeout abort): call `this.setServerStatus('down')`.

### Step 8 — Render server status indicator in `HeaderHelper`

In `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx`:
- Update the `render()` static method signature to accept the new `isSuperUser` and `serverStatus` fields from state.
- Add a private static method `#renderServerStatus(state)` that returns a `<span>` element with `data-testid="server-status"` when `state.isSuperUser` is true:
  - If `serverStatus === 'up'`: render a green indicator (e.g. `<span className="server-status up">●</span>`).
  - If `serverStatus === 'down'`: render a red indicator (e.g. `<span className="server-status down">●</span>`).
  - Otherwise (`null`): render nothing.
- Call `HeaderHelper.#renderServerStatus(state)` inside the `<Nav className="align-items-center">` section.

### Step 9 — Update specs

Update/extend the following spec files:
- `frontend/specs/assets/js/client/HealthClientSpec.js`: verify the request includes an AbortSignal and the `X-Skip-Cache: 1` header (since `/health.json` is now in skipCacheEndpoints).
- `frontend/specs/assets/js/components/elements/controllers/HeaderControllerHealthCheckSpec.js`: verify default interval changed to 60000 ms; verify 502 response calls `setServerStatus('down')`; verify network error calls `setServerStatus('down')`; verify idle > 30 min skips the check; verify activity within 30 min does not skip.
- `frontend/specs/assets/js/components/elements/HeaderSpec.js`: verify `isSuperUser` and `serverStatus` states are initialized correctly.
- `frontend/specs/assets/js/components/elements/helpers/HeaderHelperSpec.js`: verify server status indicator renders for superuser with `'up'`/`'down'`/`null` statuses; verify it is not rendered for non-superusers.
- Create `frontend/specs/assets/js/utils/ActivityTrackerSpec.js`: test `register()` / `getLastActivity()` behaviour.
- Create `frontend/specs/assets/js/client/BaseClientSpec.js` (or update if existing): test that POST/PATCH/DELETE calls `ActivityTracker.register()`; that allowlisted GET calls do too; that `/health.json` GET does not.

## Files to Change

- `frontend/assets/js/client/config/skipCacheEndpoints.js` — add `/health.json`
- `frontend/assets/js/client/HealthClient.js` — add AbortSignal timeout
- `frontend/assets/js/components/elements/controllers/HeaderController.js` — change default interval to 60000, add `setIsSuperUser`/`setServerStatus` params, add activity-aware polling logic, handle server status from response
- `frontend/assets/js/components/elements/Header.jsx` — add `isSuperUser` and `serverStatus` state, pass to controller and helper
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — add server status indicator for superusers
- `frontend/assets/js/utils/ActivityTracker.js` — new file: activity tracking singleton
- `frontend/assets/js/utils/config/activityEndpoints.js` — new file: allowlisted GET endpoints for activity tracking
- `frontend/assets/js/client/BaseClient.js` — call `ActivityTracker.register()` for qualifying requests
- `frontend/specs/assets/js/client/HealthClientSpec.js` — update for X-Skip-Cache and AbortSignal
- `frontend/specs/assets/js/components/elements/controllers/HeaderControllerHealthCheckSpec.js` — extend for new behaviors
- `frontend/specs/assets/js/components/elements/HeaderSpec.js` — extend for new state fields
- `frontend/specs/assets/js/components/elements/helpers/HeaderHelperSpec.js` — extend for server status indicator
- `frontend/specs/assets/js/utils/ActivityTrackerSpec.js` — new file
- `frontend/specs/assets/js/client/BaseClientSpec.js` — new or updated activity tracking specs

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `frontend-tests`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint_fix` (CI job: `frontend-lint`)

## Notes

- `AbortSignal.timeout(5000)` is available in modern browsers and Node 17+. If a polyfill is needed for older targets, use `const controller = new AbortController(); setTimeout(() => controller.abort(), 5000); signal = controller.signal` instead.
- The activity GET allowlist covers all game data endpoints. Since URLs contain dynamic segments (slugs, IDs), prefix matching on `'/games'` (or `pathname.startsWith('/games')`) is the simplest approach — and `/games.json` starts with `/games`, so one prefix covers all game endpoints while excluding `/health.json`, `/users/...`, etc.
- Health check calls via `HealthClient` go through `BaseClient.request()` as `GET /health.json`. Do NOT register activity for `/health.json`, even though it starts with nothing matching the allowlist — verify the allowlist does not accidentally include it.
- The server status indicator is only visible to super users (hidden otherwise). The `null` initial state means no indicator is shown until the first health check resolves.
