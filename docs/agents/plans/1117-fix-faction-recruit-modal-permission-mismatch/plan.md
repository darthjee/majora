# Plan: Fix faction recruit modal permission mismatch

Issue: [1117-fix-faction-recruit-modal-permission-mismatch.md](../../issues/1117-fix-faction-recruit-modal-permission-mismatch.md)

## Overview

Four frontend controllers gate a DM-only "recruit/give hidden" action with `access.is_superuser || access.is_dm || access.is_staff`, where `is_staff` is global Django staff, not scoped to the game. The backend only ever grants this action to `is_superuser`/per-game `is_dm`, so global staff sees a privileged action the server then rejects. Fix: drop `is_staff` from all four gates so they read `access.is_superuser || access.is_dm`. Frontend-only change; no backend work needed.

## Context

- `is_staff` is intended to make global staff act as **a player** of every game, not a DM — so it belongs in player-level gates (e.g. `canUploadPhoto`), but not in DM-only gates like these.
- Backend enforcement (`check_game_edit` → `Roles.is_admin() or Roles.is_dm()`) already excludes global staff, so this is purely about the frontend not offering an action the backend will reject.
- Full root-cause analysis and explicitly out-of-scope areas (`canUploadPhoto`, poll page-visibility gates, `ensureStaffOrSuperUser()` admin features) are documented in the issue file — no need to revisit those areas here.

## Implementation Steps

### Step 1 — Fix the four gating expressions

In each file below, change the return statement of the private static gate method from including `access.is_staff` to excluding it:

```diff
- return Boolean(access.is_superuser || access.is_dm || access.is_staff);
+ return Boolean(access.is_superuser || access.is_dm);
```

Files and exact locations:
- `frontend/assets/js/components/resources/faction/pages/controllers/GameFactionController.js:120` — `static #canRecruitHidden(access)`
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentController.js:115` — `static #canGiveHidden(access)`
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js:120` — `static #canGiveHidden(access)`
- `frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasureController.js:102` — `static #canGiveHidden(access)`

Also update each file's header JSDoc comment describing this gate (currently references "superuser/dm/staff") to drop the staff mention:
- `GameFactionController.js:19`
- `GameDocumentController.js:8` and `:19`
- `GameItemController.js:16` and `:19`
- `GameTreasureController.js:8` and `:22`

### Step 2 — Update the existing specs to match

Each controller has an existing spec asserting the gate is `true` for a staff-only user; flip these to assert `false`, keeping the same `{ is_staff: true }` mock (only the expected outcome changes):

- `frontend/specs/assets/js/components/resources/faction/pages/controllers/GameFactionControllerSpec.js` — `describe('canRecruitHidden', ...)` (line 166), staff case at lines 181-187: rename `it('is true for staff', ...)` → `it('is false for staff', ...)`, change the `toHaveBeenCalledWith` assertion from `true` to `false`.
- `frontend/specs/assets/js/components/resources/document/pages/controllers/GameDocumentControllerSpec.js` — `describe('canGiveHidden (issue #833)', ...)` (line 163), staff case at line 186: same flip.
- `frontend/specs/assets/js/components/resources/item/pages/controllers/GameItemControllerSpec.js` — `describe('canGiveHidden (issue #833)', ...)` (line 166), staff case at line 189: same flip.
- `frontend/specs/assets/js/components/resources/treasure/pages/controllers/GameTreasureController/canGiveHiddenSpec.js` — staff case at lines 34-41 (note: treasure uses a split-file spec convention, one file per behavior, unlike the other three's flat `*Spec.js` files): same flip.

Verify each spec's existing "is false for an unrelated authenticated user" (all flags false) case still passes unchanged — no action needed there, just don't break it.

## Files to Change

- `frontend/assets/js/components/resources/faction/pages/controllers/GameFactionController.js` — drop `is_staff` from `#canRecruitHidden`, update header JSDoc
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentController.js` — drop `is_staff` from `#canGiveHidden`, update header JSDoc
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js` — drop `is_staff` from `#canGiveHidden`, update header JSDoc
- `frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasureController.js` — drop `is_staff` from `#canGiveHidden`, update header JSDoc
- `frontend/specs/assets/js/components/resources/faction/pages/controllers/GameFactionControllerSpec.js` — flip staff-case expectation to `false`
- `frontend/specs/assets/js/components/resources/document/pages/controllers/GameDocumentControllerSpec.js` — flip staff-case expectation to `false`
- `frontend/specs/assets/js/components/resources/item/pages/controllers/GameItemControllerSpec.js` — flip staff-case expectation to `false`
- `frontend/specs/assets/js/components/resources/treasure/pages/controllers/GameTreasureController/canGiveHiddenSpec.js` — flip staff-case expectation to `false`

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- Backend needs no changes — `check_game_edit` already rejects global-staff-only users with 403; existing backend test `game_pc_faction_acquire_all_test.py` should stay green untouched.
- Explicitly do not touch `canUploadPhoto` gates or `ensureStaffOrSuperUser()`-gated admin features — those correctly keep `is_staff` (see issue's "Explicitly out of scope").
- Single agent involved (`frontend`) — no cross-agent contract to define.
