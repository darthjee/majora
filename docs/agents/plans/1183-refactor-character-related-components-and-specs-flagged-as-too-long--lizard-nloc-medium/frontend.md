# Frontend Plan: Refactor character-related components and specs flagged as too long (Lizard nloc-medium)

Main plan: [plan.md](plan.md)

## Overview

Codacy's Lizard analyzer flags 9 methods across 9 files under `frontend/assets/js/components/resources/character/` (and its Jasmine specs) as exceeding 50 NLOC. All six page components already delegate markup to a `XxxHelper.render()`; their bulk comes from `useState`/handler/effect bookkeeping and trailing "modals" JSX blocks. The one pure-render helper (`NpcFiltersHelper`) already partially uses the project's `#renderX` static-method convention and just needs more of its blocks pulled out the same way. The two spec files each have one oversized `it` whose bulk is large inline fixture/expected-body literals — the fix is local builder functions, mirroring the existing `support.js` fixture-externalization idiom.

Several duplications span multiple flagged files (resource-name derivation, links/money modal boilerplate, profile-photo-set handling, filter query/clear handlers) — these are extracted into small shared modules under `frontend/assets/js/components/resources/character/pages/shared/` rather than duplicated per-file, per the project's reuse guidance.

Line numbers below are current as of investigation and may drift slightly as earlier files in the list are edited first — re-check before extracting each file rather than trusting the numbers blindly.

## Implementation Steps

### Step 1 — Shared helper module: `characterResourceName.js`

Create `frontend/assets/js/components/resources/character/pages/shared/characterResourceName.js` exporting a `resourceName(characterKind)` function (`'pcs' → 'pc'`, `'npcs' → 'npc'`), replacing the duplicated implementation in `CharacterDetail.jsx` and `CharacterEdit.jsx` and the inline ternary in `CharacterPhotos.jsx`.

### Step 2 — Shared hooks: links/money modal, profile-photo actions, filter handlers

Under a new `frontend/assets/js/components/resources/character/pages/shared/hooks/` folder, add:
- `useLinksModal.js` — bundles `showLinksModal`/`links` state + open/close/confirm handlers (shared by `GameNpcNew.jsx` and `CharacterEdit.jsx`).
- `useMoneyModal.js` — bundles `showMoneyModal` state + open/close/confirm handlers, parameterized by `fields`/`setField` (shared by `GameNpcNew.jsx` and `CharacterEdit.jsx`).
- `useProfilePhotoActions.js` — bundles `profilePhotoSet`/`actionError` state + `handleSetProfilePhoto`, parameterized enough to serve `CharacterDetail.jsx`'s plain `photos` list and `CharacterPhotos.jsx`'s `character.photos` array.
- `useFilterHandlers.js` — bundles the `buildFilterQueryHash`-based `onFilterQuery`/`onFilterClear` pair (shared by `GameNpcs.jsx` and `CharacterTreasures.jsx`; do not touch the other non-character files that duplicate this same pattern — out of scope for this issue).

Each hook follows the existing private-hook convention already used in this tree (`useSlainTogglePair`, `usePlayerSlainTogglePair` in `GameNpcs.jsx`, `useNoExtra`/`useExtra` in `CharacterDetail.jsx`) — just promoted to a shared module since more than one file needs it.

### Step 3 — `GameNpcNew.jsx` (line ~18, 78→target <50)

- `usePhotoPreview(photoFile)` — private hook wrapping the `photoPreviewUrl` memo + its create/revoke `ObjectURL` effect.
- Use the shared `useLinksModal()` / `useMoneyModal(fields, setField)` from Step 2.
- `usePhotoUploadModal()` — private hook wrapping `showUploadModal`/`photoFile` open/close/confirm.
- Extract the trailing `LinksEditModal` + `PhotoUploadModal` + `MoneyEditModal` JSX block into a sub-component `GameNpcNewModals`, receiving the three hooks' results as props.
- Keep `handleSubmit`/`handleRetryPhotoUpload`/`handleSkipPhotoUpload` in the main function.

### Step 4 — `GameNpcs.jsx` (line ~73, 76→target <50)

- Use the shared `useFilterHandlers(basePath, refresh)` from Step 2, replacing the local `handleFilterQuery`/`handleFilterClear`.
- Extract the 3× `SlainConfirmModal` blocks into a sub-component `NpcSlainModals({ slain, publicSlain, playerSlain, gameSlug })`.
- `useNpcUploadModal(refresh)` — private hook bundling `uploadTarget` state + `handleUploadSuccess` + the `PhotoUploadModal` JSX (derives `uploadPath` from `resourceConfig`, so kept local rather than shared with `GameNpcNew.jsx`'s variant).

### Step 5 — `NpcFiltersHelper.jsx` (line ~23, 62→target <50)

Following the file's own existing `#renderHiddenFilter`/`#renderPrivateFilters` convention, add:
- `#renderPublicFilters(state, handlers)` — public Status + Allegiance `FilterSelect`s.
- `#renderNameField(state, handlers)` — the Name text input block.
- `#renderActions(handlers)` — Query + Clear buttons.

`render()` shrinks to the wrapping `<div>` plus calls to the 5 `#renderX` methods.

### Step 6 — `CharacterDetail.jsx` (line ~53, 69→target <50)

- Use the shared `useProfilePhotoActions(...)` from Step 2 for `profilePhotoSet`/`actionError`/`handleSetProfilePhoto`.
- `useCharacterMoneyModal(controller, gameSlug, character)` — private hook bundling `showMoneyModal` state + `handleMoneyConfirm`.
- `useCharacterPhotoActions(controller, gameSlug, characterId, characterKind)` — private hook bundling `showUploadModal`/`selectedPhoto` state + `handleUploadSuccess`.
- Extract the trailing `PhotoUploadModal` + `MoneyEditModal` + `PhotoViewModal` + `ProfilePhotoSetModal` + `extraModal` JSX block into a sub-component `CharacterDetailModals`.
- Use the shared `resourceName()` from Step 1.

### Step 7 — `CharacterEdit.jsx` (line ~51, 89→target <50)

- Extract the `applyLoadedCharacter` field-mapping effect body (the 10 `setField` calls) into `buildSetFieldHandlers(setField, setLinks)`, returning the `{setName, setRole, ...}` object; the effect body shrinks to one call.
- Use the shared `useLinksModal()` / `useMoneyModal(fields, setField, gameType)` from Step 2.
- `usePhotoUploadModal(controller, characterKind, gameSlug, characterId)` — private hook wrapping `showUploadModal` + `handleUploadSuccess` + `uploadPath` derivation.
- Extract the trailing 3-modal JSX block into `CharacterEditModals`.
- Use the shared `resourceName()` from Step 1.

### Step 8 — `CharacterPhotos.jsx` (line ~26, 73→target <50)

- Use the shared `useProfilePhotoActions(...)` from Step 2.
- `useDeletePhotoFlow(controller, gameSlug, characterId, photos, selectedPhoto)` — private hook bundling `pendingDeletePhoto` state + `handleRequestDeletePhoto`/`handleConfirmDeletePhoto` (kept local — no other flagged file shares this concern).
- Extract the trailing `PhotoUploadModal` + `PhotoViewModal` + `ProfilePhotoSetModal` + `DeletePhotoConfirmModal` JSX block into `CharacterPhotosModals`.
- Use the shared `resourceName()` from Step 1, replacing the inline ternary.

### Step 9 — `CharacterTreasures.jsx` (line ~88, 53→target <50)

- Use the shared `useFilterHandlers(basePath, refresh)` from Step 2, replacing the local `handleFilterQuery`/`handleFilterClear` (byte-for-byte identical to `GameNpcs.jsx`'s pair). This alone should be enough to clear the limit given how close this file already is (53 vs 50).
- Only if still over the limit afterward: additionally extract `handleExchangeSuccess` + `showExchangeModal` state into a small private hook `useTreasureExchangeModal(controller)`.

### Step 10 — `BaseCharacterEditController/submitFormSpec.js` (line ~26, 63→target <50)

In the `it('prevents default, resets status/errors, and submits the built fields payload', ...)` block, add two local builder functions (module scope or inside the enclosing `describe`):
- `buildFullSubmitFields()` — returns the input `fields` literal currently inlined at the call site.
- `buildFullSubmitExpectedBody()` — returns the expected `RequestStore.mutate` `body` literal.

The `it` body shrinks to: construct controller/spies → call `submitForm(event, 'demo', '1', buildFullSubmitFields(), {...})` → assertions. Optionally apply the same pattern to the neighboring `it` at ~line 164 (currently ~52 lines, not flagged but close) for consistency.

### Step 11 — `CharacterEditController/submitFormSpec.js` (line ~34, 66→target <50)

Inside the `KINDS.forEach(...)` block's `it('prevents default, resets status/errors, and submits the built fields payload', ...)`:
- Extract the `expectedFields` construction (including the `kind === 'npcs'` conditional block) into `buildExpectedFields({ kind, name, role, description, links })`.
- Extract the `submitForm` input-fields literal into `buildSubmitFields({ name, role, description, privateAllegiance, publicAllegiance, publicSlain, hidden, incognito, links })`.

Colocate both builders in the spec file itself (not `support.js`) since they're specific to this one scenario, not shared fixture data.

### Step 12 — Verify

Re-run Codacy's Lizard check locally if available, or at minimum re-count NLOC for each of the 9 methods after extraction to confirm all are under 50. Run lint, i18n check, and the full Jasmine suite (see CI Checks below).

## Files to Change

- `frontend/assets/js/components/resources/character/pages/shared/characterResourceName.js` — new shared `resourceName()` module (Step 1)
- `frontend/assets/js/components/resources/character/pages/shared/hooks/useLinksModal.js` — new shared hook (Step 2)
- `frontend/assets/js/components/resources/character/pages/shared/hooks/useMoneyModal.js` — new shared hook (Step 2)
- `frontend/assets/js/components/resources/character/pages/shared/hooks/useProfilePhotoActions.js` — new shared hook (Step 2)
- `frontend/assets/js/components/resources/character/pages/shared/hooks/useFilterHandlers.js` — new shared hook (Step 2)
- `frontend/assets/js/components/resources/character/pages/GameNpcNew.jsx` — extract hooks + `GameNpcNewModals` sub-component (Step 3)
- `frontend/assets/js/components/resources/character/pages/GameNpcs.jsx` — extract `NpcSlainModals`, `useNpcUploadModal`, adopt shared `useFilterHandlers` (Step 4)
- `frontend/assets/js/components/resources/character/pages/elements/helpers/NpcFiltersHelper.jsx` — add `#renderPublicFilters`/`#renderNameField`/`#renderActions` (Step 5)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx` — extract hooks + `CharacterDetailModals`, adopt shared modules (Step 6)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx` — extract `buildSetFieldHandlers`, hooks + `CharacterEditModals`, adopt shared modules (Step 7)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — extract `useDeletePhotoFlow` + `CharacterPhotosModals`, adopt shared modules (Step 8)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx` — adopt shared `useFilterHandlers` (Step 9)
- `frontend/specs/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController/submitFormSpec.js` — extract fixture/expected-body builders (Step 10)
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterEditController/submitFormSpec.js` — extract `buildExpectedFields`/`buildSubmitFields` (Step 11)
- Any new spec files needed to cover the newly extracted shared hooks/modules, following this codebase's existing spec-per-module convention.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- No already-merged sibling PR exists yet for this exact nloc-medium violation type to copy verbatim (issue #1152 was split into sub-issues; PR #1177 only touched docs). The extraction patterns above are derived from conventions already present elsewhere in this same directory tree (`NpcFiltersHelper.jsx`'s existing `#renderX` methods, `GameNpcs.jsx`/`CharacterDetail.jsx`'s existing private hooks, `CharacterTreasures.jsx`'s existing exported standalone functions).
- Do the six page-component files (Steps 3, 4, 6, 7, 8, 9) in an order that lets later files reuse the shared modules from Steps 1–2 once written, rather than duplicating first and de-duplicating later.
- The `useFilterHandlers`/`buildFilterQueryHash` pattern is also duplicated in several non-character files (`GameTreasures.jsx`, `GamePolls.jsx`, `StaffUsers.jsx`, `Treasures.jsx`, `StlModels.jsx`) — unifying those is out of scope for this issue; only `GameNpcs.jsx` and `CharacterTreasures.jsx` should adopt the new shared hook.
- Re-verify line numbers per file immediately before editing it — they will shift as earlier steps land.
