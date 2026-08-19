# Frontend Plan: Consolidate Header's data-fetching into a single dedicated endpoint

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes `GET /users/header_status.json` (backend-provided — see [plan.md](plan.md)'s Shared contracts table for the exact response shape). Must:

- Register the endpoint's exact path in the skip-cache config the same way `/users/status.json` already is.
- Map the response into `Header`'s existing state setters, including the derived `canViewAs` and the required `cache_token` → `AuthStorage` wiring.
- Preserve `AuthEvents` emission and the existing catch-and-ignore error handling, unchanged.

## Implementation Steps

### Step 1 — Add a client method for the new endpoint

Add a method to `frontend/assets/js/client/AuthClient.js` (alongside `status(token)` at lines 38-40), e.g. `headerStatus(token)`, hitting `GET /users/header_status.json`.

### Step 2 — Register the skip-cache config

Add `/users/header_status.json` to `frontend/assets/js/client/config/skipCacheEndpoints.js`'s exact-match `Set`, immediately after the existing `/users/status.json` entry (line 11) — this is not optional, see the issue's Security & performance section for why a miss here is a cache-correctness bug, not a style nit.

### Step 3 — Swap `HeaderController#checkStatus`

In `frontend/assets/js/components/common/header/controllers/HeaderController.js`:

- `checkStatus()` (lines 106-133): call the new `AuthClient#headerStatus` instead of `client.status(token)`. Map `logged_in`/`is_superuser`/`is_staff` → `setLoggedIn`/`setIsSuperUser`/`setIsStaff` as today, `status === 'pending'` → `setPendingApproval` as today (line ~127), and add `AuthStorage.setCacheToken(data.cache_token)` (mirroring the existing `cache_token` handling around lines 120-121) — this hydration must not be dropped.
- Keep emitting `AuthEvents` exactly as today (line 128) so `recheckAuthState` (lines 237-240) and other subscribers (`RequestStore`, `AppController`, etc.) keep working.
- Preserve the existing try/catch shape (non-OK response returns early untouched, network/parse errors swallowed silently, no retry/rethrow — lines 106-133).

### Step 4 — Derive `canViewAs` locally, retire the separate fetch

In `frontend/assets/js/components/common/header/controllers/HeaderViewAsController.js`, replace `checkAvailability()`'s call to `AccessStore.isReallyAdminOrStaff()` (lines 31-35) with a local derivation of `isSuperUser || isStaff` from the state `Header.jsx` now resolves via Step 3 (no new fetch).

Once this is the only caller removed, delete the now-dead `AccessStore.isReallyAdminOrStaff()` alias (`frontend/assets/js/utils/access/store/AccessStore.js:186-188`) — confirmed to have exactly one production caller. Do **not** touch `AccessStore.ensureStaffOrSuperUser()`/`AccessStoreAdmin` itself (`AccessStoreAdmin.js:42`) — it's a shared gate used by ~13 other call sites (`StaffDashboardController`, `TreasureEditController`, `CollectionNewController`, `useStaffOrSuperUser.js`, etc.), out of scope for this issue.

### Step 5 — `Header.jsx` wiring

`Header.jsx` hand-instantiates the controllers per render (no Stimulus/registry indirection) — confirm the prop/state plumbing between `HeaderController` (now resolving `isSuperUser`/`isStaff`) and `HeaderViewAsController` (now consuming those instead of fetching its own) stays wired the same way the existing `gameAccess`/`loggedIn` state already flows between controllers and `Header.jsx`'s `useState`/`useEffect` calls.

### Step 6 — Tests

Update/add Jasmine specs:
- `frontend/specs/assets/js/components/common/header/controllers/HeaderController/` — cover the new `headerStatus` call, the `cache_token`/`AuthStorage` wiring, and the `pending`/anonymous/logged-in response branches.
- `frontend/specs/assets/js/components/common/header/controllers/HeaderViewAsControllerSpec.js` — replace the `isReallyAdminOrStaff()` mock/assertions with the new local derivation.
- `frontend/specs/assets/js/client/AuthClient/` — cover the new `headerStatus` client method.
- `frontend/specs/assets/js/client/BaseClient/skipCacheHeaderSpec.js` — extend to cover the new endpoint's skip-cache registration, alongside the existing `/users/status.json` coverage.
- Remove/update any spec exercising the now-deleted `AccessStore.isReallyAdminOrStaff()`.

## Files to Change

- `frontend/assets/js/client/AuthClient.js` — new `headerStatus` method (Step 1)
- `frontend/assets/js/client/config/skipCacheEndpoints.js` — register new path (Step 2)
- `frontend/assets/js/components/common/header/controllers/HeaderController.js` — swap data source (Step 3)
- `frontend/assets/js/components/common/header/controllers/HeaderViewAsController.js` — local `canViewAs` derivation (Step 4)
- `frontend/assets/js/utils/access/store/AccessStore.js` — delete `isReallyAdminOrStaff()` alias (Step 4)
- `frontend/assets/js/components/common/header/Header.jsx` — confirm wiring only, likely no logic change (Step 5)
- Jasmine specs listed in Step 6

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- `gameAccess` (`HeaderGameAccessController`) and `facadeEnabled` (`AccessStoreFacade`) are explicitly out of scope — do not modify either.
- If the backend agent picks a different endpoint path than `/users/header_status.json`, update Steps 1-2 and `skipCacheEndpoints.js`'s entry to match before implementing.
