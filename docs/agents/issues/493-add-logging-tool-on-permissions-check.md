# Issue: Add logging tool on permissions check

## Problem
There is currently no visibility into why a permission or access check on `AccessStore` resolves to a denied/failed state.

`AccessCache` (used internally by `AccessStorePermissions` and `AccessStoreAccess`) fails closed silently on any fetch error, swallowing the error and resolving to the default (denied) value. This makes it hard to debug why a specific check (e.g. `can_edit`) ended up `false`, and, when the "view as" facade (`AccessStoreFacade`) is simulating roles, whether the request actually ran under the real identity or a simulated one.

## Expected Behavior
### `VITE_FRONTEND_LOG_LEVEL` is not defined (defaults to `error`)
- `MajoraLogger` receives a call for `error` with `{ some_data: "some value" }`
  - It calls `console.error({ some_data: "some value" })`
- `MajoraLogger` receives a call for `debug` with `{ some_data: "some value" }`
  - It does not call `console.debug`

### `VITE_FRONTEND_LOG_LEVEL` is defined as `debug`
- `MajoraLogger` receives a call for `error` with `{ some_data: "some value" }`
  - It calls `console.error({ some_data: "some value" })`
- `MajoraLogger` receives a call for `debug` with `{ some_data: "some value" }`
  - It calls `console.debug({ some_data: "some value" })`

### Permission check with an active "view as" facade
- Caller requests character permissions passing the real roles `['player']`
- The facade is enabled and simulating `['dm']`
- The `debug` log for that request reports both the real roles (`['player']`) and the effective roles actually sent to the backend (`['dm']`)

## Proposed Solution
- Introduce a `MajoraLogger` class with a static method per log level (`error`, `warn`, `info`, `debug`), each delegating to the matching `console` method, gated by a build-time-configured minimum level using the standard severity order `error > warn > info > debug`.
- The active level is read from a Vite-exposed env var set at build time, `VITE_FRONTEND_LOG_LEVEL` (default `error` when unset). Messages below the configured level are dropped and never reach `console`.
- Extract the check-and-log behavior into a dedicated class that wraps every `AccessStore` check — `*Access` (identity), `*Permissions` (can_edit), and `ensureSuperUser`/`ensureStaffOrSuperUser` — logs each request at `debug` level with the method name, its arguments, and the resolved result or error, then returns the value unchanged.
- For `*Permissions` checks specifically, since the "view as" facade (`AccessStoreFacade`) can substitute the roles actually requested, the logged entry must include both the caller-supplied (real) roles and the effective (possibly simulated) roles that were actually sent, so it is clear whether a given check ran under a mock and, if so, against which simulated role set.

## Benefits
- Enables verbose access/permission-check logging to be toggled at build/deploy time, without a code change.
- Debug logging can be turned on temporarily (e.g. via a CircleCI env var) to investigate an access issue, then turned back off for the next deploy.
- Makes it clear, per logged check, whether the request ran under a real identity or a simulated ("view as") one.
