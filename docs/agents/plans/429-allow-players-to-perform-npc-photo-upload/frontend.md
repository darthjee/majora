# Frontend Plan: Allow players to perform NPC photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on backend's `NpcPlayerEditPermission` being honored at the NPC upload-init and
upload-finalize endpoints (from #429's backend.md), and on #416 already having merged
`is_player` into `character` (show page, via `CharacterController#fetchAndMergeAccess`) and
into page-level state (index page, via `GameNpcsController#fetchAccess`).

**Critical constraint:** the upload-button gate must be its own boolean, never blended into the
`can_edit`/`canEdit` value already used for the DM edit button, the "New NPC" button, and the
slain/revive button set. Widening `can_edit`/`canEdit` itself to include `is_player` would
incorrectly also expose those other GM-only controls to a mere player.

## Reconciliation note (post-#427, current merged shape as of this implementation)

The steps below were re-verified against the actual merged code (after #416 and #427 both
landed), not just the prose above, and are simpler than originally scoped:

- `CharacterHelper.jsx`'s `#renderPicture` passes `canEdit={character.can_edit}` to
  `ActionsOverlay` at what is now line 128 (line drifted from #427's `ActionBar` extraction,
  content unchanged) — Step 1 below still applies as originally written, just at the new line.
- On the index page, #416 already threads `isPlayer` all the way from
  `GameNpcsController#fetchAccess` → `GameNpcs.jsx` → `GameCharactersHelper.render(...)` →
  `CharacterCard` → into `CharacterCardHelper.render`'s `playerOptions.isPlayer` (used today
  only to gate the player-facing slain button via `#buildSecondaryButtons`). Because
  `playerOptions.isPlayer` is already available inside `CharacterCardHelper#renderPhoto`, no new
  parameter needs to be threaded through `GameCharactersHelper.jsx`, `CharacterCard.jsx`, or
  `GameNpcs.jsx` at all — Step 2 is now scoped to `CharacterCardHelper.jsx` alone.

## Implementation Steps

### Step 1 — Show page: decoupled upload gate

In `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`, `#renderPicture`
(currently passes `canEdit={character.can_edit}` to `ActionsOverlay`, ~line 128): change the
value passed as `ActionsOverlay`'s `canEdit` prop specifically to
`character.can_edit || (!character.is_pc && character.is_player)`. Do not touch
`#buildSecondaryButtons`'s own gating (~line 162-176) — it must keep using `character.can_edit`
/`character.is_player` exactly as it does today, unaffected by this change. Since
`ActionsOverlay`'s `canEdit` prop only governs the upload button (per #427's `ActionBar`
extraction, confirmed in `ActionsOverlay.jsx`) and `secondaryButtons` is a separately-built
array, these two concerns are already independent props on the same call — this is a value
change on one prop, not a structural change.

### Step 2 — Index page: decoupled upload gate (scoped to CharacterCardHelper only)

`CharacterCardHelper.render`'s `#renderPhoto` currently passes the plain `canEdit` argument as
`ActionsOverlay`'s `canEdit` prop (~line 169), while `#buildSecondaryButtons(character, canEdit,
onSlainClick, onPublicSlainClick, playerOptions)` (~line 126) already derives its own
`isPlayer`/`onPlayerSlainClick` from the `playerOptions` object (destructured with defaults
`{ isPlayer = false, onPlayerSlainClick = Noop.noop }`).

- In `#renderPhoto`, compute a local `canUploadPhoto = canEdit || (playerOptions.isPlayer ??
  false)` and pass that (not the plain `canEdit`) as `ActionsOverlay`'s `canEdit` prop. Leave
  every other use of `canEdit` in this file (including inside `#buildSecondaryButtons`)
  unchanged.
- No changes needed to `GameCharactersHelper.jsx`, `CharacterCard.jsx`, or `GameNpcs.jsx` —
  `isPlayer` already flows down to `CharacterCardHelper` via the existing `playerOptions`
  argument (added by #416), so there is nothing new to thread through the call chain.
- PC cards are unaffected: `#renderPhoto` returns the plain `CardAvatar` (no `ActionsOverlay` at
  all) when `characterType !== 'npc'`, so this change is inherently NPC-only without needing an
  explicit `is_pc`-style guard.

## Files to Change

- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — decoupled upload gate on
  the show page.
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` — decoupled upload
  gate on the index-page card, reusing the already-threaded `playerOptions.isPlayer`.
- Corresponding specs under `frontend/specs/assets/js/components/pages/helpers/CharacterHelper/`
  and `frontend/specs/assets/js/components/elements/helpers/CharacterCardHelperSpec.js` (or
  wherever each currently lives) — new cases asserting: a player (not editor) sees the upload
  button but NOT the "New NPC" button or the slain/revive buttons; an editor still sees
  everything as today; a plain visitor sees neither. No new spec cases are needed for
  `GameCharactersHelperSpec.js` since its signature/behavior does not change.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Verify manually (per this project's `/verify` convention): a player-of-the-game user should
  see and be able to use the upload button on an NPC's show page and index card, but should NOT
  see the "New NPC" button, the DM edit button, or the slain/revive buttons; a PC's upload
  button behavior must be provably unchanged for the same user.
- If #427 (action-bar extraction) has landed by the time this is implemented, `ActionBar`'s
  `canEdit` prop is still the right thing to pass the widened boolean into — #427 doesn't
  change what that prop means, only where its rendering lives.
