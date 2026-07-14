# Plan: Use value modification modal for treasures

Issue: [504-use-value-modification-modal-for-treasures.md](../../issues/504-use-value-modification-modal-for-treasures.md)

## Overview

Replace the plain numeric `value` input on the four treasure new/edit forms with a
collapsed CP/SP/GP breakdown display (matching the existing `/#/treasures/:id` style)
plus an "Edit value" modal, mirroring the money-edit modal already used on PC/NPC edit
forms. The existing modal is currently hardcoded to the `character` money context
(CP/SP/GP/PP/gems); this plan generalizes it to accept a `context` prop so it can be
reused as-is for the `treasure` context (CP/SP/GP only), which `DndMoneyModel` already
defines. No backend or API changes are needed — `Treasure.value` stays a single integer.

## Context

- `frontend/assets/js/components/resources/character/pages/elements/MoneyEditModal.jsx`
  (+ `controllers/MoneyEditModalController.js` + `helpers/MoneyEditModalHelper.jsx`) is
  the existing modal, wired into `CharacterEdit.jsx` (shared by PC/NPC edit pages). It
  hardcodes `MONEY_CONTEXT = 'character'` and `DENOMINATION_KEYS = ['cp','sp','gp','pp','gems']`.
- `frontend/assets/js/utils/money/DndMoneyModel.js` already defines a `treasure` context
  (`denominations: ['cp','sp','gp']`, `cascadeThreshold: 10`), used today only by
  `TreasureMoney`/`TreasureMoneyHelper` for the read-only breakdown text shown on the
  treasure listing/detail pages (e.g. `Treasure.jsx`).
- The four treasure form pages (`TreasureNew.jsx`/`TreasureEdit.jsx`/`GameTreasureNew.jsx`/
  `GameTreasureEdit.jsx`, each with its own `*Helper.jsx` + `*Controller.js`) currently
  render `value` as a single `FormField type="number"`, e.g.
  `frontend/assets/js/components/resources/treasure/pages/helpers/TreasureNewHelper.jsx`.
  Unlike the PC/NPC character pages, these four pages have no shared parent component —
  each page/helper/controller trio is separate and will need the same change applied
  independently (there is no NPC-"new"-style precedent for the modal on creation pages;
  the character-side modal is only wired into the shared *edit* page today, so the new
  treasure "new" pages are new wiring, not a copy of an existing "new" page).
- Denomination labels (`money.copper_piece`, `money.silver_piece`, `money.gold_piece`)
  already exist in `frontend/assets/i18n/en.yaml`/`pt.yaml` and are reused as-is — no new
  translation keys needed for the modal fields. The `money_edit_modal.*` title/confirm/cancel
  keys are also reused, since the modal is the same component for both contexts.

## Implementation Steps

### Step 1 — Generalize the money-edit modal to accept a context

Move `MoneyEditModal.jsx` (+ its controller/helper) out of the `character`-specific
`pages/elements/` folder into a shared location (e.g.
`frontend/assets/js/components/common/`), since it will now be used by both character
and treasure pages. Update:

- `MoneyEditModalController.js`: replace the hardcoded `MONEY_CONTEXT`/`DENOMINATION_KEYS`
  constants with a small per-context denomination-key map (`{ character: [...5 keys], treasure: ['cp','sp','gp'] }`)
  and thread a `context` argument through `seedBreakdown`, `canConfirm`, and `computeTotal`
  (which already accept/forward a context to `MoneyModelRegistry`/`DndMoneyModel` — only
  the local `DENOMINATION_KEYS` constant needs to become context-dependent).
- `MoneyEditModalHelper.jsx`: filter `DENOMINATION_ROWS` down to the keys relevant for the
  given context (character keeps all 5 rows; treasure renders only cp/sp/gp rows), reusing
  the existing `money.*` label keys for the 3 shared denominations.
- `MoneyEditModal.jsx`: accept a `context` prop (default `'character'` or made required,
  whichever keeps `CharacterEdit.jsx`'s existing usage unchanged) and pass it through to the
  controller/helper calls.
- Update `CharacterEdit.jsx`'s existing `<MoneyEditModal .../>` usage and import path to
  match the new location; verify no other behavior changes for the character flow.

### Step 2 — Add a collapsed value display + edit trigger to each treasure form

For each of the four page/helper/controller trios
(`TreasureNew`, `TreasureEdit`, `GameTreasureNew`, `GameTreasureEdit`):

- Remove the plain `value` `FormField` from the helper's render output.
- Render the current value's collapsed breakdown using the existing `TreasureMoney`
  component (same one used on `/#/treasures/:id`), plus a button/control that opens the
  modal (mirroring `onOpenMoneyModal`/`showMoneyModal` from `CharacterEdit.jsx`).
- In each page component, add local `showValueModal` state and render
  `<MoneyEditModal show={...} money={value} context="treasure" onClose={...} onConfirm={(newTotal) => { setValue(String(newTotal)); setShowValueModal(false); }} />`,
  following the same pattern as `CharacterEdit.jsx`'s money modal wiring.
- Keep `value` submission to the controller's `submitForm` unchanged — only how `value` is
  edited in the UI changes, not the payload shape sent to the backend.

### Step 3 — Tests

- Update/move specs for the relocated `MoneyEditModal`/controller/helper to their new path,
  adding cases for the `treasure` context (3-row rendering, cp/sp/gp-only pack/seed) while
  keeping existing `character`-context cases passing.
- Add specs for each treasure page/helper covering: collapsed value display rendering,
  opening the modal, confirming updates `value`, and cancelling leaves it unchanged —
  mirroring the existing `MoneyEditModalSpec.js`/`CharacterEdit`-related spec patterns.

## Files to Change

- `frontend/assets/js/components/common/MoneyEditModal.jsx` (moved from `resources/character/pages/elements/`) — add `context` prop
- `frontend/assets/js/components/common/controllers/MoneyEditModalController.js` (moved) — context-aware denomination keys
- `frontend/assets/js/components/common/helpers/MoneyEditModalHelper.jsx` (moved) — context-aware row filtering
- `frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx` — update import path, pass `context="character"`
- `frontend/assets/js/components/resources/treasure/pages/TreasureNew.jsx`, `TreasureEdit.jsx`, `GameTreasureNew.jsx`, `GameTreasureEdit.jsx` — add modal state/wiring
- `frontend/assets/js/components/resources/treasure/pages/helpers/TreasureNewHelper.jsx`, `TreasureEditHelper.jsx`, `GameTreasureNewHelper.jsx`, `GameTreasureEditHelper.jsx` — replace raw value input with breakdown display + edit trigger
- `frontend/specs/...` — mirrored spec updates/additions for all files above

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- No backend changes: `Treasure.value` remains a single `IntegerField`; only the frontend
  editing experience changes.
- `GameTreasureEditHelper`'s unrelated `maxUnits`/`isExclusive` field is untouched.
- Confirmed with the user during discussion: the raw numeric `value` input is removed
  entirely, not kept alongside the breakdown display.
