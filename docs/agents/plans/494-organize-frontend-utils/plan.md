# Plan: Organize frontend utils

Issue: [494-organize-frontend-utils.md](../issues/494-organize-frontend-utils.md)

## Overview
`frontend/assets/js/utils` currently holds ~28 files flat in one directory (2 subfolders already exist: `money/`, `config/`). This plan splits the flat files into domain subfolders — `access/`, `access/store/`, `auth/`, `routing/`, `logging/`, `ui/` — moving `CoinBreakdown.js` and `mergeCharacterTreasureQuantity.js` into the existing `money/`, leaving `Noop.js` and `config/` where they are, mirroring the move in `frontend/specs/assets/js/utils`, and updating every relative import across the codebase to the new paths. This is a pure move-and-relink: no file renames, no behavior changes.

## Context
The flat layout makes it hard to tell which utilities are related and gives new utilities no obvious home. `frontend/assets/js/components` already uses this subfolder pattern (`common/`, `helpers/`, `resources/`), as does `utils/money` and `utils/config` today.

## Implementation Steps

### Step 1 — Create target folders and move source files
Create `frontend/assets/js/utils/{access,access/store,auth,routing,logging,ui}/` and `git mv` each file into its new home (see Files to Change below). Do not rename any file in the process.

### Step 2 — Move matching spec files
Mirror the same moves under `frontend/specs/assets/js/utils`, including moving the existing nested `AccessStore/` spec folder (accessSpec.js, adminSpec.js, facadeSpec.js, permissionsSpec.js, syncSpec.js, support.js) to `access/store/`. The Jasmine glob (`specs/**/*[sS]pec.js`) picks up specs regardless of subfolder depth, so no config change is needed there.

### Step 3 — Update all import paths
Every relative import pointing at a moved file breaks because the move changes path depth by one level (two for files under `access/store/`). Update:
- All importers under `frontend/assets/js/` (~47 files) — grep for `utils/<OldName>` after each move to find remaining stragglers.
- All importers under `frontend/specs/assets/js/` (~153 files), including sibling imports between moved util files themselves (e.g. `AccessStoreFacade.js` importing `AccessStoreAccess.js`) and imports from the moved `AccessStore/` spec folder.

Work file-by-file per moved module (`git mv` immediately followed by fixing its own internal imports, then a repo-wide grep for its old path) rather than moving everything first and fixing imports after — keeps each step independently verifiable.

### Step 4 — Verify with lint and tests
Run lint and the full Jasmine suite (see CI Checks) to catch any remaining stale import path, including ones inside `.jsx`/test helper files that a plain grep might miss.

## Files to Change

Move into `frontend/assets/js/utils/access/`:
- `AccessCache.js`, `AccessEvents.js`, `accessRouteConfig.js`, `AccessRouteConfigStore.js`

Move into `frontend/assets/js/utils/access/store/`:
- `AccessStore.js`, `AccessStoreAccess.js`, `AccessStoreAdmin.js`, `AccessStoreDescriptor.js`, `AccessStoreFacade.js`, `AccessStoreKeys.js`, `AccessStoreLogging.js`, `AccessStorePermissions.js`

Move into `frontend/assets/js/utils/auth/`:
- `AuthEvents.js`, `AuthStorage.js`

Move into `frontend/assets/js/utils/routing/`:
- `Route.js`, `Router.js`, `HashRouteResolver.js`, `HashQueryParams.js`

Move into `frontend/assets/js/utils/money/` (existing folder):
- `CoinBreakdown.js`, `mergeCharacterTreasureQuantity.js`

Move into `frontend/assets/js/utils/logging/`:
- `MajoraLogger.js`, `ResilienceEvents.js`, `ActivityTracker.js`

Move into `frontend/assets/js/utils/ui/`:
- `Icons.js`, `AllegianceBorder.js`

Unchanged in place:
- `frontend/assets/js/utils/Noop.js`
- `frontend/assets/js/utils/config/activityEndpoints.js`
- `frontend/assets/js/utils/money/DndMoneyModel.js`, `MoneyModelRegistry.js`

Mirror every move above under `frontend/specs/assets/js/utils/` for the matching `*Spec.js` files, plus:
- `frontend/specs/assets/js/utils/AccessStore/` (whole folder) → `frontend/specs/assets/js/utils/access/store/`

Plus every file under `frontend/assets/js/` and `frontend/specs/assets/js/` that imports any of the moved paths (found via `grep -rl "utils/<OldName>" frontend/assets/js frontend/specs/assets/js` per moved file).

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- Pure move-and-relink: no filenames change, so `git mv` diffs stay readable and reviewable per file.
- Work incrementally (one moved module at a time, fix its importers immediately) rather than moving all 28 files first — makes it much easier to isolate a broken import if lint/tests fail partway through.
- Double-check imports *between* moved utils themselves (e.g. `access/store/AccessStoreFacade.js` importing sibling `access/store/AccessStoreAccess.js`, or `access/accessRouteConfig.js` importing `access/store/AccessStore.js`) — these are easy to miss since both sides moved.
