# Issue: Do not redirect due to lack of access until access data has been fetched

## Description
Commit `62d96537c09368fd88802b4b6d7eaec32fb4bb7b` (Fix #466 — #472) changed `CharacterController` to render the PC/NPC edit pages immediately using `AccessStore`'s synchronous, fail-closed readers, then re-render once the real access/permissions fetches resolve in the background. This introduced a redirect race in the PC/NPC edit flow.

## Problem
On pages like `/#/games/:game_slug/pcs/:id/edit`, `CharacterController#fetchAndMergeAccess` (`frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js`) does a first pass that synchronously reads `AccessStore.getCharacterPermissions()`. While the real permissions request is still in flight, that reader returns the fail-closed default `{ can_edit: false }`, and `fetchAndMergeAccess` calls `setCharacter` with it.

`CharacterEdit.jsx`'s effect on `character` (`frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx`) fires immediately and calls `controller.applyLoadedCharacter`. `BaseCharacterEditController#shouldRedirect` (`frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js`) treats any loaded character with `can_edit: false` as "not editable" and redirects away — before the real permissions fetch (the second pass in `fetchAndMergeAccess`) has a chance to resolve.

As a result, a user who genuinely has edit access can be bounced off the edit page whenever the permissions request has not completed yet by the time the first render happens.

This only affects the PC/NPC edit flow (`CharacterController` + `BaseCharacterEditController`). The Game/Treasure/GameSession edit controllers (`GameEditController`, `TreasureEditController`, `GameTreasureEditController`, etc.) already gate on the real `AccessStore.ensure*Permissions()` promise via `.then()`/`fetchWithAccess` before ever setting the resource, so they do not exhibit this race and are out of scope for this fix.

## Expected Behavior
The edit page must not redirect away for lack of permission until the real permissions check has actually resolved. A `can_edit: false` produced by the fail-closed default (fetch still pending) must not be treated the same as a `can_edit: false` from a resolved, authoritative response.

## Solution
Thread a "permissions resolved" signal through the character merge in `CharacterController` (e.g. an `access_resolved` flag alongside `can_edit`/`is_player`), and have `BaseCharacterEditController#shouldRedirect` only redirect once that flag is true:

- First pass (synchronous, fail-closed defaults): render optimistically (loading state), but `access_resolved` is `false`, so no redirect is triggered even if `can_edit` reads `false`.
- Second pass (once `AccessStore.ensureCharacterPermissions`/`ensureCharacterAccess` resolve): carries the accurate `can_edit` plus `access_resolved: true`. Only then can `shouldRedirect` act on a `can_edit: false`.

Scope of the change: `CharacterController.js`, `BaseCharacterEditController.js`, and `CharacterEdit.jsx` only. No changes to the Game/Treasure/GameSession edit controllers, which already wait on the real permissions promise and do not have this race.
