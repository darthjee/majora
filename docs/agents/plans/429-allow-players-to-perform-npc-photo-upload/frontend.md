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

## Implementation Steps

### Step 1 — Show page: decoupled upload gate

In `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`, `#renderPicture`
(currently passes `canEdit={character.can_edit}` to `ActionsOverlay`, ~line 124): change the
value passed as `ActionsOverlay`'s `canEdit` prop specifically to
`character.can_edit || (!character.is_pc && character.is_player)`. Do not touch
`#buildSecondaryButtons`'s own `character.is_pc || !character.can_edit` gate (~line 152) — it
must keep using `character.can_edit` alone, unaffected by `is_player`. Since `ActionsOverlay`'s
`canEdit` prop only governs the upload button (per #427's `ActionBar` extraction) and
`secondaryButtons` is a separately-built array, these two concerns are already independent
props on the same call — this is a value change on one prop, not a structural change.

### Step 2 — Index page: decoupled upload gate

This one needs a new, distinct parameter, because `CharacterCardHelper.render`'s single
`canEdit` argument currently drives both the upload button AND the slain-button-array gating
(`#buildSecondaryButtons(character, canEdit, ...)`) for NPC cards — widening it in place would
leak slain-toggle visibility to players too.

- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx`: add a new
  parameter (e.g. `canUploadPhoto = canEdit`) to `render(...)` and thread it to `#renderPhoto`,
  passed as `ActionsOverlay`'s `canEdit` prop in place of the plain `canEdit` value. Leave the
  existing `canEdit` argument's use in `#buildSecondaryButtons(character, canEdit, ...)`
  unchanged.
- `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx`: add the matching
  `canUploadPhoto = canEdit` parameter to `render(...)`, spread into `CharacterCard` alongside
  the existing NPC-only props (~line 69: `{...(isNpc ? { canEdit, onUploadClick, onSlainClick,
  onPublicSlainClick, canUploadPhoto } : {})}`).
- `frontend/assets/js/components/pages/GameNpcs.jsx`: read the page-level `isPlayer` state
  #416 adds to `GameNpcsController`, and pass `canEdit || isPlayer` as the new
  `canUploadPhoto` argument into `GameCharactersHelper.render(...)`, while still passing the
  original `canEdit` value unchanged for its existing parameter (drives "New NPC" + slain
  gating).
- `frontend/assets/js/components/pages/GamePcs.jsx` / PC call sites: unaffected —
  `canUploadPhoto` defaults to `canEdit`, and `GameCharactersHelper` only spreads any of these
  NPC-only props when `characterType === 'npc'` in the first place.

## Files to Change

- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — decoupled upload gate on
  the show page.
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` — new
  `canUploadPhoto` parameter.
- `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx` — thread
  `canUploadPhoto` through.
- `frontend/assets/js/components/pages/GameNpcs.jsx` — compute `canEdit || isPlayer` and pass
  it as `canUploadPhoto`.
- Corresponding specs under `frontend/specs/assets/js/components/pages/helpers/CharacterHelper/`,
  `frontend/specs/assets/js/components/elements/helpers/CharacterCardHelperSpec.js`, and
  `frontend/specs/assets/js/components/pages/helpers/GameCharactersHelperSpec.js` (or wherever
  each currently lives) — new cases asserting: a player (not editor) sees the upload button but
  NOT the "New NPC" button or the slain/revive buttons; an editor still sees everything as
  today; a plain visitor sees neither.

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
