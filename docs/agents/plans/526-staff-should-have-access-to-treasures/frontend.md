# Frontend Plan: Staff should have access to treasures page and endpoints

Main plan: [plan.md](plan.md)

## Shared contracts

- No new backend field is needed. `AccessStore` already exposes an
  `ensureStaffOrSuperUser()` check (used by the staff-user pages) alongside the existing
  `ensureSuperUser()` — this plan swaps the latter for the former on the treasure pages
  only. Backend's permission change (see [backend.md](backend.md)) makes the corresponding
  API calls succeed for staff; no coordination/ordering is required between the two agents.

## Implementation Steps

### Step 1 — Route guard config

`frontend/assets/js/utils/access/accessRouteConfig.js:72-73` (`treasureNew`, `treasures`)
and `:68-70` (`treasureEdit`): change `{ kind: 'superuser' }` to
`{ kind: 'staffOrSuperuser' }` for all three, mirroring `staffUsers`/`staffUser`/
`staffUserEdit` (`:74-76`). Do **not** touch `gameTreasures`/`gameTreasureNew`/
`gameTreasureEdit` (`:35, :39-41`) — those are pattern-based, game-scoped routes, out of
scope for this issue.

### Step 2 — Controllers: swap `ensureSuperUser()` for `ensureStaffOrSuperUser()`

Mirror the exact pattern already used in `StaffUsersController.js:47,52`,
`StaffUserController.js:48,53`, `StaffUserEditController.js:47,52`
(all resolved via `AccessStoreAdmin.js:41-51`) in these three files:

- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasuresController.js:51-63`
  — swap the `AccessStore.ensureSuperUser()` call (redirect + `setIsSuperUser(true)`).
  Consider renaming the local state/prop from `isSuperUser` to something scope-neutral
  (e.g. `canManage`) if it reads confusingly once staff can also trigger it — judgment
  call, not required.
- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasureNewController.js:34-35,64,66`
  — swap both the mount-redirect check and the form-submit guard.
- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasureEditController.js:47,52`
  — swap the mount-redirect check.

### Step 3 — Propagate the renamed/re-scoped flag through the render chain

The `isSuperUser` boolean set in Step 2 flows through:
`Treasures.jsx:16,21,47` → `TreasuresHelper.jsx:27,40` (`render(...)` param, forwarded as
`canManage`) → `TreasureCard.jsx:29,31` → `TreasureCardHelper.jsx:39,47,64,91-92` (gates the
edit link / upload button on each card). No structural change needed here beyond making
sure the boolean now reflects "is superuser or staff" instead of "is superuser only" —
since it already flows in from the controller, this should require no edits unless Step 2's
optional rename is done, in which case propagate the new name through this same chain.

## Files to Change

- `frontend/assets/js/utils/access/accessRouteConfig.js` — `treasures`, `treasureNew`,
  `treasureEdit` route kinds: `superuser` → `staffOrSuperuser`.
- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasuresController.js`
- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasureNewController.js`
- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasureEditController.js`
- (Only if Step 2's optional rename is taken) `Treasures.jsx`, `TreasuresHelper.jsx`,
  `TreasureCard.jsx`, `TreasureCardHelper.jsx` — propagate the renamed flag.
- Specs to update (currently assert superuser-only behavior):
  - `frontend/specs/assets/js/utils/access/accessRouteConfigSpec.js`
  - `frontend/specs/assets/js/components/resources/treasure/pages/TreasuresSpec.js`
  - `frontend/specs/assets/js/components/resources/treasure/pages/controllers/TreasuresControllerSpec.js`
  - `frontend/specs/assets/js/components/resources/treasure/pages/controllers/TreasureNewController/support.js`
  - `frontend/specs/assets/js/components/resources/treasure/pages/controllers/TreasureNewController/submitFormSpec.js`
  - `frontend/specs/assets/js/components/resources/treasure/pages/controllers/TreasureNewController/buildEffectSpec.js`
  - `frontend/specs/assets/js/components/resources/treasure/pages/controllers/TreasureEditController/buildEffectSpec.js`
  - Add a staff-user case alongside each existing superuser case (staff succeeds on global
    treasure routes) per the mirrored `StaffUsersController`/etc. specs, for reference on
    the expected test shape.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- `kind: 'superuser'` is used *only* by `treasures`/`treasureNew`/`treasureEdit` in
  `accessRouteConfig.js` — no other route shares it, so this change has no blast radius
  beyond the treasure pages.
- Game-scoped treasure routes/pages (`gameTreasures`, `gameTreasureNew`,
  `gameTreasureEdit`) already use pattern-based guards, not `superuser`/`staffOrSuperuser`
  — confirm no accidental edits land there.
