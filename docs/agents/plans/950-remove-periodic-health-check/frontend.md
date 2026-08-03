# Frontend Plan: Remove periodic health check

Main plan: [plan.md](plan.md)

## Shared contracts

The backend agent is removing the `/health.json` endpoint entirely (it will 404 afterward). This plan removes every frontend caller of it, so no runtime code should be left pointing at that path once both agents are done.

## Implementation Steps

### Step 1 — Remove the health-check client

Delete `frontend/assets/js/client/HealthClient.js` (and its spec `frontend/specs/assets/js/client/HealthClientSpec.js`).

### Step 2 — Remove polling from `HeaderController`

In `frontend/assets/js/components/common/header/controllers/HeaderController.js`:
- Remove the `HealthClient` import, the `healthClient` constructor param/property, and the `healthIntervalId` property.
- Remove `startHealthCheck`, `stopHealthCheck`, and `#pollHealth`.
- Remove the `setServerStatus` constructor param and property (and its JSDoc entry), and the `THIRTY_MINUTES_MS` constant if nothing else in the file uses it after the above removals.
- Remove the now-unused `ActivityTracker` import (its only use in this file is inside `#pollHealth`).

### Step 3 — Remove call sites in `Header.jsx`

In `frontend/assets/js/components/common/header/Header.jsx`:
- Remove the `serverStatus`/`setServerStatus` state (`useState(null)`).
- Remove `controller.startHealthCheck();` from the mount effect and `controller.stopHealthCheck();` from its cleanup.
- Remove the corresponding constructor argument passed to `new HeaderController(...)` and the `serverStatus` field passed into `HeaderHelper.render`'s state object.

### Step 4 — Remove the UI indicator

In `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`:
- Remove the `#renderServerStatus` private method.
- Remove its call site (`{HeaderHelper.#renderServerStatus(state)}`) inside `render`.
- Drop `serverStatus` and `isSuperUser`-for-this-purpose from the `state` JSDoc type on `render` (keep `isSuperUser` in the JSDoc if it's still used elsewhere in the file — check `HeaderNavHelper` usage before removing it from the type).

### Step 5 — Remove the keep-alive/activity-tracking hook

This hook (`ActivityTracker` + `BaseClient`'s activity registration for GET requests) exists solely to let `#pollHealth` skip polling after 30 minutes of idle time. With polling gone, remove it:

- Delete `frontend/assets/js/utils/logging/ActivityTracker.js` and its spec.
- In `frontend/assets/js/client/BaseClient.js`: remove the `ActivityTracker` and `ACTIVITY_ENDPOINT_PREFIXES` imports, the `ActivityTracker.register()` call for POST/PATCH/DELETE and allowlisted GETs, and the `#shouldRegisterActivity` method entirely. Update the class-level JSDoc (mentions "registers user activity for qualifying requests") and the `request` method's JSDoc (mentions registering activity for POST/PATCH/DELETE and allowlisted GET endpoints) to drop those references.
- Delete `frontend/assets/js/utils/config/activityEndpoints.js` (only consumer is `BaseClient`).
- Delete `frontend/specs/assets/js/client/BaseClient/activityTrackingSpec.js`.

### Step 6 — Remove the `/health.json` skip-cache entry

In `frontend/assets/js/client/config/skipCacheEndpoints.js`, remove the `'/health.json'` entry from the `Set` (leave `/ready.json` and the rest untouched).

### Step 7 — Clean up remaining specs

- Delete `frontend/specs/assets/js/components/common/header/controllers/HeaderController/startHealthCheckSpec.js` and `stopHealthCheckSpec.js`.
- In `frontend/specs/assets/js/components/common/header/controllers/HeaderController/support.js`, remove any shared setup specific to health-check/server-status (e.g. `healthClient`/`setServerStatus` stubs) that becomes unused once the above specs are gone — check remaining specs in that folder still compile against the trimmed support file.
- In `frontend/specs/assets/js/components/common/header/HeaderSpec.js`, remove the `HealthClient` import, the `spyOn(HealthClient.prototype, 'check')` stub, and the `spyOn(HeaderController.prototype, 'startHealthCheck'/'stopHealthCheck')` stubs — replace/drop whatever assertions depended on them.

### Step 8 — Update stale doc comments

`HeaderRouteResolver.js`, `HeaderViewAsController.js`, and `HeaderGameAccessController.js` each have a doc comment mentioning "health-check orchestration" as something they're *not* responsible for (contrasting with `HeaderController`). Update those comments to drop the now-nonexistent "health-check" mention (e.g. "auth/route orchestration" instead of "auth/route/health-check orchestration"), since this is trivial doc upkeep the issue explicitly called out of scope for design purposes but still needs a mechanical touch-up once the orchestration is gone.

## Files to Change

- `frontend/assets/js/client/HealthClient.js` — delete
- `frontend/specs/assets/js/client/HealthClientSpec.js` — delete
- `frontend/assets/js/components/common/header/controllers/HeaderController.js` — remove health polling, `setServerStatus`, related imports
- `frontend/assets/js/components/common/header/Header.jsx` — remove `serverStatus` state and start/stop calls
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — remove `#renderServerStatus` and its call site
- `frontend/assets/js/utils/logging/ActivityTracker.js` — delete
- `frontend/specs/assets/js/utils/logging/ActivityTrackerSpec.js` — delete, if present (check exact spec path/name before deleting)
- `frontend/assets/js/client/BaseClient.js` — remove `#shouldRegisterActivity` and its call site/imports
- `frontend/assets/js/utils/config/activityEndpoints.js` — delete
- `frontend/specs/assets/js/client/BaseClient/activityTrackingSpec.js` — delete
- `frontend/assets/js/client/config/skipCacheEndpoints.js` — remove the `/health.json` entry
- `frontend/specs/assets/js/components/common/header/controllers/HeaderController/startHealthCheckSpec.js` — delete
- `frontend/specs/assets/js/components/common/header/controllers/HeaderController/stopHealthCheckSpec.js` — delete
- `frontend/specs/assets/js/components/common/header/controllers/HeaderController/support.js` — trim health/server-status-specific setup
- `frontend/specs/assets/js/components/common/header/HeaderSpec.js` — trim health-check-related stubs/imports
- `frontend/assets/js/components/common/header/controllers/HeaderRouteResolver.js` — drop "health-check" from doc comment
- `frontend/assets/js/components/common/header/controllers/HeaderViewAsController.js` — drop "health-check" from doc comment
- `frontend/assets/js/components/common/header/controllers/HeaderGameAccessController.js` — drop "health-check" from doc comment

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) — runs all Jasmine specs, including the ones deleted/trimmed above
- `frontend`: `npm run lint` (CI job: `frontend-checks`) — catches unused imports left behind by the removals

## Notes

- Confirm no CSS/SCSS targets `.server-status` before/after removal — a repo-wide search found none, so no stylesheet cleanup is expected, but double-check since a miss here would just leave dead CSS (harmless but worth a quick grep).
- `THIRTY_MINUTES_MS` in `HeaderController.js` and the `ActivityTracker`/`ACTIVITY_ENDPOINT_PREFIXES` imports in `BaseClient.js` should only be removed if nothing else in those files still uses them post-cleanup — verify with a search before deleting the constant/import lines outright.
