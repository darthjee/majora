# Plan: Fix treasure acquisition modal

Issue: [641-fix-treasure-acquisition-modal.md](../../issues/641-fix-treasure-acquisition-modal.md)

## Overview

The treasure exchange modal's Acquire tab, and the NPC treasures list, decide between
the public treasure endpoints and the DM/superuser-only `all.json`/`acquire/all.json`
ones using the wrong permission signal: the character-level `can_edit` (which is `true`
for a PC's own owning player, not just DM/superuser). The fix threads the game-level
`can_edit` (`AccessStore.ensureGamePermissions`, already used correctly by
`GameTreasuresController` for the DM's game-wide treasures page) through instead,
everywhere this routing decision is made. This is frontend-only — no backend or endpoint
changes.

## Context

- `TreasureExchangeModalController#fetchAcquirePage`/`#acquire` and
  `TreasureClient`/`CharacterClient`'s `*All`/`*Acquire*All` methods already correctly
  expect a "DM/admin" `canEdit` boolean — their JSDoc already documents it that way. The
  bug is entirely in how that boolean is currently computed upstream.
- `BaseCharacterTreasuresController#mergeAccess` calls
  `AccessStore.ensureCharacterPermissions(this.characterKind, gameSlug, characterId)` and
  stores the result as `character.can_edit`. For a PC, this is `true` for the DM, a
  superuser, **or the PC's own owning player** (backend:
  `Character.editors`/`can_be_edited_by`). For an NPC it happens to collapse to exactly
  DM-or-superuser (no owner concept), which is why the NPC path isn't visibly broken today
  — but it's relying on the same wrong signal by coincidence.
- `character.can_edit` is consumed in two ways from `CharacterTreasures.jsx`:
  1. `CharacterTreasuresHelper.render(..., character?.can_edit, ...)` — gates the "Add
     treasure" button. This is a genuine character-edit action; leave it as-is.
  2. `buildExchangeCharacter(...)` → `canEdit: character?.can_edit` — fed into the modal
     to pick the treasure endpoint. This is the bug: it must reflect *game*-edit
     permission, not character-edit permission.
- `BaseCharacterTreasuresController#fetchNpcTreasures` independently calls
  `AccessStore.ensureCharacterPermissions('npcs', gameSlug, characterId)` a second time,
  to decide between `treasures.json` and `treasures/all.json` for the NPC's own
  owned-treasures list. Same wrong signal, same fix.
- Reference implementation already in the codebase:
  `frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasuresController.js`
  calls `AccessStore.ensureGamePermissions(gameSlug)` and uses the resulting `can_edit` to
  choose `treasures/all.json` vs `treasures.json` — mirror this pattern.

## Implementation Steps

### Step 1 — Resolve game-level permission alongside character data

In `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterTreasuresController.js`:

- In `#fetchCharacterData`/`#mergeAccess`, additionally call
  `AccessStore.ensureGamePermissions(gameSlug)` and merge its `can_edit` onto the character
  object under a new field, e.g. `game_can_edit` (keep the existing `can_edit` — the
  character-level one — untouched, since the "Add treasure" button still needs it).
  Resolve both permission checks in parallel (`Promise.all`) rather than sequentially, to
  avoid adding a network round-trip to page load.
  - Fall back to `false` for `game_can_edit` if this check fails, consistent with the
    existing fallback behavior for `can_edit`.

### Step 2 — Fix the NPC treasures-list endpoint choice

In the same file, `#fetchNpcTreasures` currently branches on
`AccessStore.ensureCharacterPermissions('npcs', gameSlug, characterId)`'s `can_edit`.
Switch it to `AccessStore.ensureGamePermissions(gameSlug)`'s `can_edit` instead, matching
`GameTreasuresController`'s existing pattern. (This doesn't change any currently-passing
test's expected behavior for NPCs — DM/superuser-or-not — but fixes the signal for
correctness and consistency, per the issue's explicit "fix everywhere" scope.)

### Step 3 — Fix the modal's endpoint choice

In `frontend/assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx`,
`buildExchangeCharacter` currently sets `canEdit: character?.can_edit`. Change it to
`canEdit: character?.game_can_edit` (the new field from Step 1), so the Acquire tab's
`treasures/all.json`/`treasures/acquire/all.json` routing (in
`TreasureExchangeModal.jsx` / `TreasureExchangeModalController.js`, unchanged) is finally
driven by the correct, DM/superuser-only permission. Update the surrounding JSDoc comments
(`buildExchangeCharacter`, `CharacterTreasures`) that currently describe `canEdit` as
coming from `character.can_edit`/"the DM/admin `canEdit` flag" without mentioning the
game-level source.

### Step 4 — Specs

- Update/add specs for `BaseCharacterTreasuresController` covering: a PC (or NPC) owner
  who is not DM/superuser now gets `game_can_edit: false` even though their own
  `can_edit` is `true`; a DM/superuser gets `game_can_edit: true`; the NPC list fetch now
  calls `treasures/all.json` based on game permission, not character permission (add a
  case for an NPC-owning... n/a, but specifically: a scenario where character-level
  `can_edit` and game-level `can_edit` disagree, to prove the right one drives the
  request).
- Update `buildExchangeCharacter`'s spec (`CharacterTreasuresSpec.js` or similar) to
  assert `canEdit` is sourced from `game_can_edit`, not `can_edit`.
- Existing specs in `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterTreasuresController/npcAllTreasuresSpec.js` and
  `frontend/specs/assets/js/components/resources/character/pages/elements/TreasureExchangeModalSpec.js`
  mock `AccessStore`/`ensureCharacterPermissions`; check whether they need updating to
  also mock/assert `ensureGamePermissions` for the paths touched above.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterTreasuresController.js`
- `frontend/assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx`
- Corresponding specs under `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterTreasuresController/` and
  `frontend/specs/assets/js/components/resources/character/pages/CharacterTreasuresSpec.js` (or wherever `buildExchangeCharacter` is currently tested)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- No backend or endpoint changes — `treasures.json`/`treasures/all.json` and their
  acquire counterparts already enforce exactly the right permissions
  (`GameEditPermission`/`Game.can_be_edited_by`); this issue is purely about which one the
  frontend calls.
- `TreasureExchangeModal.jsx`/`TreasureExchangeModalController.js`/`TreasureClient.js`/
  `CharacterClient.js` need no changes — their `canEdit` parameter was already documented
  and implemented as "DM/admin", it was just being fed the wrong value from upstream.
- Root cause detail worth keeping in the PR description: `Character.editors` includes the
  PC's owning player (so `can_be_edited_by`/`can_edit` is `true` for that player), while
  `Game.can_be_edited_by` (backing `treasures/all.json`'s `GameEditPermission`) is
  DM/superuser only — the two permissions look similar but are not interchangeable.
