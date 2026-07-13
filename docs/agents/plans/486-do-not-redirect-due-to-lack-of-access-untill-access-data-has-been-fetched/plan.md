# Plan: Do not redirect due to lack of access until access data has been fetched

Issue: [486_do-not-redirect-due-to-lack-of-access-untill-access-data-has-been-fetched.md](../../issues/486-do-not-redirect-due-to-lack-of-access-untill-access-data-has-been-fetched.md)

## Overview
Fix the PC/NPC edit page redirect race introduced by `62d96537c`: `CharacterController#fetchAndMergeAccess` renders a "first pass" character using `AccessStore`'s synchronous, fail-closed `can_edit: false` default while the real permissions request is still in flight, and `BaseCharacterEditController#shouldRedirect` can't tell that apart from a genuine denial, so it redirects away before the real permissions fetch (the "second pass") resolves. The fix threads an `access_resolved` flag through the merge so the redirect only fires once the real permissions check has actually settled.

This is entirely within the `frontend` agent's scope — no backend, proxy, or infra changes are involved.

## Context
- `CharacterController.js` (`fetchAndMergeAccess`/`#loadCharacterAccess`/`#mergeAccess`) does two passes: a synchronous first pass reading `AccessStore.getCharacterAccess`/`getCharacterPermissions` (fail-closed defaults while fetches are pending), then a second pass once `AccessStore.ensureCharacterAccess`/`ensureCharacterPermissions` resolve.
- `CharacterEdit.jsx` has a `useEffect` on `character` that calls `controller.applyLoadedCharacter` on every change, including the first pass.
- `BaseCharacterEditController#shouldRedirect` (`Boolean(character) && !character.can_edit`) treats any non-null character with `can_edit: false` as "redirect now" — it has no way to distinguish "we know for sure they can't edit" from "we don't know yet."
- Game/Treasure/GameSession edit controllers do not have this race: `GameEditController`/`TreasureEditController`/`GameTreasureEditController` gate on the real `AccessStore.ensure*Permissions()` promise via `.then()`/`fetchWithAccess` before ever calling their setter, so they never render an intermediate fail-closed state. No changes needed there.

## Implementation Steps

### Step 1 — Carry an `access_resolved` flag through `CharacterController`'s merge
In `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js`:
- `#mergeAccess` currently returns `{ ...character, can_edit: permissions.can_edit, is_player: access.is_player }`. Add an `access_resolved: boolean` field, true only once both `AccessStore.ensureCharacterAccess` and `AccessStore.ensureCharacterPermissions` have resolved for the current route (i.e. true on the second-pass merge, false on the first-pass merge).
- The simplest way to know which pass is running: `fetchAndMergeAccess` already calls `#loadCharacterAccess` once synchronously (first pass) and once inside the `Promise.all(...).then()` callback (second pass, after the real fetches resolve). Thread an explicit `resolved` boolean parameter through `#loadCharacterAccess`/`#mergeAccess` from each call site instead of trying to re-derive it from cache state.

### Step 2 — Gate the redirect on `access_resolved`
In `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js`:
- Update `#shouldRedirect(character)` to `Boolean(character) && character.access_resolved && !character.can_edit` — only redirect once the real permissions check has actually settled.
- `applyLoadedCharacter` otherwise keeps its current behavior: while `access_resolved` is false, it falls through past the (now-false) redirect check to the `if (!character) return;` guard — but `character` is non-null on the first pass, so form seeding would run against fail-closed data. Confirm this doesn't seed the form with wrong data (it currently only seeds fields once `can_edit` is true per `CharacterEdit.jsx`'s render guard at line 73 — `if (!character || !character.can_edit) return EditHelper.renderLoading();` — so seeding while `access_resolved` is false and `can_edit` is (correctly) false is already inert; no additional guard needed there).

### Step 3 — Confirm `CharacterEdit.jsx` needs no change
`CharacterEdit.jsx`'s effect and render guard (`if (!character || !character.can_edit) return EditHelper.renderLoading();`) already keep showing the loading state until `can_edit` is true, and now `shouldRedirect` also won't fire until `access_resolved` is true — so no changes should be needed here, but re-verify once Steps 1–2 land in case the interaction between the loading-state render and the redirect timing needs adjustment.

### Step 4 — Update/add specs
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterController/fetchAndMergeAccessSpec.js`: assert the first-pass merge sets `access_resolved: false` and the second-pass merge (after the access/permissions promises resolve) sets `access_resolved: true`.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController/applyLoadedCharacterSpec.js`: add a case where `character.can_edit` is `false` and `character.access_resolved` is `false` (or absent) — assert no redirect happens. Keep/add the existing case where `access_resolved` is `true` and `can_edit` is `false` — assert the redirect still happens.
- Check `frontend/specs/support/accessStoreStub.js` for whether the stub needs to expose distinct pending vs. resolved states to drive these two cases; extend it if the current stub always resolves synchronously.

## Files to Change
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js` — add `access_resolved` to the merged character, distinguishing first pass vs. second pass.
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js` — gate `#shouldRedirect` on `access_resolved`.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterController/fetchAndMergeAccessSpec.js` — cover the new flag.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController/applyLoadedCharacterSpec.js` — cover the gated redirect.
- `frontend/specs/support/accessStoreStub.js` — extend only if needed to simulate a still-pending permissions fetch for the new spec cases.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- Keep the fix scoped to the PC/NPC edit flow, per the issue's confirmed scope — do not touch `GameEditController`, `TreasureEditController`, `GameTreasureEditController`, or `GameSessionEditController`, which do not exhibit this race.
- `CharacterController` is also used by the character *show* page (not just edit) — verify that adding `access_resolved` to the merged character object doesn't affect the show page's rendering (it doesn't currently branch on `access_resolved`, so this should be additive only).
