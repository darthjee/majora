# Plan: Add logging tool on permissions check

Issue: [493-add-logging-tool-on-permissions-check.md](../issues/493-add-logging-tool-on-permissions-check.md)

## Overview

Add a build-time-configurable `MajoraLogger` utility, and use it to log every
`AccessStore` check (`*Access`, `*Permissions`, and superuser/staff-or-superuser)
at `debug` level — including the real vs. "view as"-simulated roles for
`*Permissions` checks — so failures that currently fail silently closed become
debuggable by toggling `VITE_FRONTEND_LOG_LEVEL` at build time.

## Context

`AccessCache.ensure()` (`frontend/assets/js/utils/AccessCache.js:26-40`) fails
closed on any non-abort fetcher rejection: it catches the error in `#fail`
(`AccessCache.js:79-92`) and resolves the *public* promise to the caller-supplied
default instead of rejecting. This means the raw error is only ever visible
inside the `fetcher` closures built by `AccessStoreAccess`, `AccessStorePermissions`,
and `AccessStoreAdmin` (all three follow the same `cache.ensure(key, fetcher, default)`
shape) — by the time `AccessStore`'s public methods return the promise, it has
already resolved to the fail-closed default with the error gone. Logging must
therefore hook in at the `fetcher` level, not around `AccessStore`'s public
methods, or the "why did this fail" problem in the issue won't actually be
solved.

`AccessStoreFacade.effectiveRoles(roles)` (`AccessStoreFacade.js:58-64`) is a
pure, side-effect-free read of the "view as" facade state; it can be called an
extra time purely for logging purposes without affecting `AccessStore`'s own
`effectiveRoles` computation inside `AccessStorePermissions`.

Vite exposes any `VITE_`-prefixed variable already present in the shell
environment to `import.meta.env` automatically — no `vite.config.js` change or
`.env` file is required for `VITE_FRONTEND_LOG_LEVEL` to reach the client
bundle at build time (`frontend/vite.config.js` currently has no `env`/`define`
customization, and doesn't need one for this).

## Implementation Steps

### Step 1 — Add `MajoraLogger`

Create `frontend/assets/js/utils/MajoraLogger.js`, a static class (no
instances, matching the style of `AccessStoreKeys`/`AccessStoreFacade` in the
same folder):

- A fixed level order, most to least severe: `error`, `warn`, `info`, `debug`.
- Reads `import.meta.env.VITE_FRONTEND_LOG_LEVEL` once at module load; falls
  back to `'error'` when unset or when its value isn't one of the four known
  level names.
- One static method per level — `error(data)`, `warn(data)`, `info(data)`,
  `debug(data)` — each calling `console[level](data)` only when that level is
  at or above (i.e. as-or-more severe than) the configured threshold; otherwise
  it's a no-op. `error` calls are effectively always emitted, since there's no
  level more severe than it.

### Step 2 — Add `AccessStoreLogging`

Create `frontend/assets/js/utils/AccessStoreLogging.js`, a static class that
wraps a fetcher-building call and logs its outcome at `debug` via
`MajoraLogger`, without altering the resolved value or rejection:

- A method like `wrap(method, args, fetcherPromise, meta = {})` that attaches
  `.then`/`.catch` observers to `fetcherPromise`, calls
  `MajoraLogger.debug({ method, args, ...meta, result })` on success or
  `MajoraLogger.debug({ method, args, ...meta, error })` on failure, and
  returns the original promise unchanged (same resolved value or rejection) so
  callers (`AccessCache.ensure`) see no behavior change.

### Step 3 — Wire logging into the three `AccessStore*` check families

In `AccessStoreAccess.js`, `AccessStorePermissions.js`, and `AccessStoreAdmin.js`,
wrap each `fetcher` passed to `cache.ensure(key, fetcher, default)` with
`AccessStoreLogging.wrap(...)`, at the point where the raw promise chain
(before `AccessCache` catches it) is still observable:

- `AccessStoreAccess`: wrap `ensureGame`, `ensureCharacter`, `ensureTreasure` —
  `meta` is just the resource identifiers already passed in.
- `AccessStoreAdmin`: wrap `ensureSuperUser`, `ensureStaffOrSuperUser` — no
  extra `meta` needed.
- `AccessStorePermissions`: wrap `ensureGame`, `ensureCharacter`, `ensureTreasure`
  — since each of these already computes `roleSet` via
  `AccessStoreFacade.effectiveRoles(roles)` before calling `cache.ensure`, pass
  both the caller-supplied `roles` and the computed `roleSet` as `meta: { roles, effectiveRoles: roleSet }`,
  so the debug log makes it explicit whether — and against which simulated
  role set — the "view as" facade substituted the real roles.

### Step 4 — Tests

Add Jasmine specs under `frontend/specs/assets/js/utils/`:

- `MajoraLoggerSpec.js` — covers the default (`error`-only) threshold, an
  explicit `VITE_FRONTEND_LOG_LEVEL` override, and that each level only calls
  its matching `console` method when at/above the threshold (mirroring the two
  scenarios from the issue's `## Expected Behavior`).
- Extend the existing `AccessStoreAccessSpec.js`, `AccessStorePermissionsSpec.js`,
  and `AccessStoreAdminSpec.js` (or add sibling specs) to assert
  `MajoraLogger.debug` is called with the expected `method`/`args`/`result`
  (and `roles`/`effectiveRoles` for the permissions family) on both success and
  failure, without changing the resolved/rejected value seen by `AccessCache`.

## Files to Change

- `frontend/assets/js/utils/MajoraLogger.js` — new, build-time-gated logger.
- `frontend/assets/js/utils/AccessStoreLogging.js` — new, fetcher-wrapping
  debug-log helper shared by the three check families.
- `frontend/assets/js/utils/AccessStoreAccess.js` — wrap each `fetcher`.
- `frontend/assets/js/utils/AccessStorePermissions.js` — wrap each `fetcher`,
  threading `roles`/`effectiveRoles` into the log.
- `frontend/assets/js/utils/AccessStoreAdmin.js` — wrap each `fetcher`.
- `frontend/specs/assets/js/utils/MajoraLoggerSpec.js` — new.
- `frontend/specs/assets/js/utils/AccessStoreAccessSpec.js`,
  `AccessStorePermissionsSpec.js`, `AccessStoreAdminSpec.js` — extend with
  logging assertions.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)

## Notes

- No `vite.config.js` or CircleCI config change is required for
  `VITE_FRONTEND_LOG_LEVEL` to reach the build — Vite exposes any
  `VITE_`-prefixed shell env var to `import.meta.env` automatically. Actually
  toggling it for a given CircleCI run (setting the env var when triggering
  the build, then unsetting it) is an operational step outside this plan's
  code changes.
- Do not wrap `AccessStore`'s public `ensure*` methods themselves — by the
  time they return, `AccessCache` has already fail-closed any rejection into
  the resolved default, so the original error would be lost. The wrap must sit
  around the `fetcher` closures inside `AccessStoreAccess`/`AccessStorePermissions`/`AccessStoreAdmin`.
- The synchronous `get*` reads (`getGame`, `getCharacter`, etc.) don't trigger
  a fetch and have nothing new to log; they're out of scope.
