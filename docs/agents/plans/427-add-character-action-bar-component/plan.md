# Plan: Add character action bar component

Issue: [427-add-character-action-bar-component.md](../issues/427-add-character-action-bar-component.md)

## Overview

Pure frontend refactor, no behavior change. `ActionsOverlay.jsx` already centralizes the
photo, the hover CSS, and the upload/secondary buttons, but renders the upload button and the
secondary-buttons row inline via two private module-level functions
(`renderUploadButton`/`renderSecondaryButtons`). Extract those into a new, named `ActionBar`
component, keeping `ActionsOverlay`'s external prop API (`secondaryButtons`, `canEdit`,
`onClick`, etc.) exactly as it is today so none of its callers change. Separately, consolidate
the duplicated secondary-button array-building logic in `CharacterHelper#buildSecondaryButtons`
and `CharacterCardHelper`'s equivalent into one shared helper, since both build the identical
real-slain/public-slain button shape.

## Context

- `frontend/assets/js/components/elements/ActionsOverlay.jsx:27-71` — `renderUploadButton` and
  `renderSecondaryButtons`, the two functions to extract.
- `frontend/assets/js/components/elements/ActionsOverlay.jsx:96-109` — the component itself,
  whose props must not change.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx:151-174` —
  `#buildSecondaryButtons` for the NPC/PC show page (handlers passed directly as `onClick`,
  gated on `character.is_pc || !character.can_edit`).
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx:94-117` — the
  index-card equivalent (`onClick` wrapped through `#buildOverlayClickHandler` for
  `preventDefault`/`stopPropagation`, since cards sit inside an `<a>`; gated on `canEdit` alone
  — `is_pc` is already excluded by the caller only invoking this for `characterType === 'npc'`).
  Both build an identical two-entry array: real-slain/revive (`Icons.heart`/`Icons.skullFill`)
  and public-slain/revive (`Icons.heartOutline`/`Icons.skull`), each
  `{label, variant, icon, onClick}`.
- CSS driving the mouse-over reveal is untouched by this issue: `frontend/assets/css/main.scss:38-84`.
- Existing `ActionsOverlay` specs to preserve behavior-for-behavior:
  `frontend/specs/assets/js/components/elements/ActionsOverlay/{containerSpec,photoTypeSpec,uploadButtonSpec,secondaryButtonSpec}.js`.

## Implementation Steps

### Step 1 — Extract the `ActionBar` component

Create `frontend/assets/js/components/elements/ActionBar.jsx`, moving `renderUploadButton` and
`renderSecondaryButtons` (and the `SECONDARY_BUTTON_POSITION_CLASSES` constant they use) out of
`ActionsOverlay.jsx` into it, as a single component rendering both the upload button and the
secondary-buttons row (same DOM/classes as today — `actions-overlay-button`/`-left`,
`actions-overlay-button-right`/`-right-2` — no CSS changes needed). Props: `canEdit`, `onClick`
(upload), `secondaryButtons`.

Update `ActionsOverlay.jsx` to render `<ActionBar canEdit={canEdit} onClick={onClick}
secondaryButtons={secondaryButtons} />` in place of the two inline calls, keeping its own
props (`type`, `url`, `alt`, `canEdit`, `onClick`, `grayscale`, `secondaryButtons`) completely
unchanged — every existing caller (`CharacterHelper`, `CharacterCardHelper`, `GameHelper`,
`GameEditHelper`, `BaseCharacterEditHelper`, `TreasureCardHelper`) needs zero changes.

### Step 2 — Consolidate the secondary-button-building helper

Add a shared helper (e.g. `frontend/assets/js/components/elements/helpers/SlainSecondaryButtons.js`,
a plain function, not a component) that takes `(character, onSlainClick, onPublicSlainClick)`
and returns the two-entry `{label, variant, icon, onClick}` array — identical to what both
`CharacterHelper#buildSecondaryButtons` and `CharacterCardHelper#buildSecondaryButtons` build
today, minus each caller's own gating and `onClick`-wrapping concerns (those stay in the
callers, since they differ: `CharacterHelper` passes handlers straight through, while
`CharacterCardHelper` wraps them through `#buildOverlayClickHandler` for `preventDefault`).

Update both `CharacterHelper.jsx` and `CharacterCardHelper.jsx` to call the shared helper
instead of duplicating the array-building, keeping their respective gating checks
(`is_pc || !can_edit` vs. the caller-side `characterType === 'npc'` + `canEdit` check) and
`onClick`-wrapping exactly as they are today.

### Step 3 — Specs

- Move/rename the existing `ActionsOverlay` upload/secondary-button specs
  (`uploadButtonSpec.js`, `secondaryButtonSpec.js`) to target the new `ActionBar` component
  directly, preserving every assertion (upload button gating and left-modifier, 0/1/2
  secondary buttons with correct position classes and independent `onClick`s). Keep
  `containerSpec.js`/`photoTypeSpec.js` on `ActionsOverlay` (still its responsibility), adding
  a small assertion that it delegates to `ActionBar` with the right props if not already
  implied by the moved specs.
- Add a spec for the new shared secondary-button-building helper, asserting the exact button
  shape (labels/variants/icons for both slain states) independent of either caller.
- Update `CharacterHelperSlainSpec.js` and `CharacterCardHelperSpec.js` only as needed to keep
  passing against the refactored call (no behavior change expected, so assertions on rendered
  output should be unaffected).

## Files to Change

- `frontend/assets/js/components/elements/ActionsOverlay.jsx` — delegate to new `ActionBar`.
- `frontend/assets/js/components/elements/ActionBar.jsx` (new) — extracted rendering.
- `frontend/assets/js/components/elements/helpers/SlainSecondaryButtons.js` (new) — shared
  button-array builder.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — use shared helper.
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` — use shared helper.
- `frontend/specs/assets/js/components/elements/ActionsOverlay/*` — split/move specs to cover
  `ActionBar` directly.
- New spec file for `SlainSecondaryButtons.js`.
- `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSlainSpec.js`,
  `frontend/specs/assets/js/components/elements/helpers/CharacterCardHelperSpec.js` — adjust as
  needed.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Purely internal refactor — no visual or behavioral change; verify manually (per this
  project's `/verify` convention) that the upload/slain/revive buttons still appear on hover in
  the same positions on both the NPC/PC show pages and index cards.
- This groundwork directly supports #416 (upcoming player-facing slain button): once this
  lands, #416's frontend work should add its new button through `ActionBar`/the shared helper
  rather than re-duplicating logic — but sequencing/ordering between the two issues is a
  separate concern from this plan.
