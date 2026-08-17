# Frontend Plan: Move DocumentPagesBox to the right column on document show/edit pages

Main plan: [plan.md](plan.md)

## Overview

Move the document "pages" content — `DocumentPagesBox` (`GameDocument` show), the edit-mode pages editor (`GameDocument` edit), and `CharacterDocumentPagesBox` (PC/NPC `CharacterDocument` show) — from `ShowPageLayout`'s full-width `bottom` slot into its `right` column, below the existing description. On the edit page, the Save button and `DocumentPagesSaveFailedAlert` move along with the pages editor, since today they render entirely outside `ShowPageLayout` in a separate container.

## Implementation Steps

### Step 1 — Move `DocumentPagesBox` into `documentShowType.right` (Show mode)

In `frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js`:
- Remove `{ Show: DocumentPagesBox }` from the `bottom` array.
- Add `{ Show: DocumentPagesBox }` to the `right` array, after the `DescriptionBox`/`DocumentDescriptionField` entry (`{ Show: DescriptionBox, Edit: DescriptionBox, New: DocumentDescriptionField }`), so on the show page it renders below the description.
- Update the file's doc comment: it currently explains `DocumentPagesBox` as the first `bottom` slot "above both shortlists" — rewrite to describe its new position in `right`, below the description.

### Step 2 — Add an `Edit` entry for the pages content in `documentShowType.right`

Still in `documentShowType.js`: add an `Edit` key to the same `right` slot entry (or a new adjacent entry, whichever reads cleaner given `DescriptionBox`'s own `Edit` variant already sits there) that renders the edit-mode pages content. This slot needs to carry through `DocumentPagesEditBox` plus the page-level Save button and `DocumentPagesSaveFailedAlert` — see Step 3 for how those get here without `documentShowType` importing edit-page-only wiring (`pagesRef`, `saveStatus`, `onSave`, etc.) directly into a slot component that also renders on `new`.

Recommended shape: introduce a small wrapper component (e.g. `DocumentPagesEditSlot.jsx` next to `DocumentPagesEditBox.jsx`) that reads `pagesRef`, `saveStatus`, `onSave`, `onRetrySave`, `onSkipSave`, `gameSlug`, `canUploadPhoto`/`canEditPages`, and `id` off the merged `ShowPageLayout` context (the same way `DocumentPagesBox` already reads `game_slug`/`id`/`canEditPages` off context) and renders `DocumentPagesEditBox` + the Save button + `DocumentPagesSaveFailedAlert` together. Use this wrapper as the `Edit` entry in `right`.

### Step 3 — Rework `GameDocumentEditHelper`/`GameDocumentEdit` to feed the pages-edit context through `ShowPageLayout`

In `frontend/assets/js/components/resources/document/pages/helpers/GameDocumentEditHelper.jsx`:
- Remove the separate `<div className="container">` block that currently renders `DocumentPagesEditBox`, the Save button, and `DocumentPagesSaveFailedAlert` outside `ShowPageLayout`.
- Fold `pagesRef`, `saveStatus`, `onSave`, `onRetrySave`, `onSkipSave` (currently destructured from the `pages` param) into `ShowPageLayout`'s `context` prop, alongside `document`, `canUploadPhoto`, and `handlers`, so Step 2's `Edit`-mode slot component receives them as props.
- Delete the now-unused `#renderSaveButton`/`#renderPagesSaveFailedAlert` private methods from this helper (their logic moves into the new wrapper from Step 2) — or keep them there and have the wrapper delegate back, whichever keeps the diff smaller; judgment call during implementation.

`GameDocumentEdit.jsx` itself likely needs no changes — it already builds `pagesRef`/`pagesSaveStatus`/`onSave`/`onRetrySave`/`onSkipSave` and passes them into `GameDocumentEditHelper.render`'s `pages` argument; only where that data ends up inside the render tree changes.

### Step 4 — Move `CharacterDocumentPagesBox` into `characterDocumentShowType.right`

In `frontend/assets/js/components/common/show_page/show_types/configs/characterDocumentShowType.js`:
- Remove `{ Show: CharacterDocumentPagesBox }` from `bottom`.
- Add `{ Show: CharacterDocumentPagesBox }` to `right`, after the existing `{ Show: DescriptionBox }` entry.
- Update the doc comment the same way as Step 1.

### Step 5 — Update specs

- `frontend/specs/assets/js/components/common/show_page/show_types/configs/documentShowTypeSpec.js` — update assertions on which slot (`left`/`right`/`bottom`) contains `DocumentPagesBox`/the new edit wrapper for each mode.
- `frontend/specs/assets/js/components/common/show_page/show_types/configs/characterDocumentShowTypeSpec.js` — same, for `CharacterDocumentPagesBox`.
- `frontend/specs/assets/js/components/resources/document/pages/helpers/GameDocumentEditHelperSpec.js` — update to reflect that `DocumentPagesEditBox`/Save button/failure alert now render through `ShowPageLayout`'s context instead of a separate container; the previous assertions on the removed `<div className="container">` block need to move to wherever the new wrapper component is tested.
- Add/update a spec for the new wrapper component from Step 2 (e.g. `DocumentPagesEditSlotSpec.js`), covering both the read-only "Edit pages" affordance and the full editor state, mirroring `DocumentPagesBoxHelperSpec.js`'s existing coverage of the analogous show-mode toggle.
- `frontend/specs/assets/js/components/common/show_page/ShowPageLayoutSpec.js` likely needs no change — it tests the generic slot-rendering mechanism, not any specific `showTypeConfig` entry.

## Files to Change

- `frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js` — move `DocumentPagesBox` from `bottom` to `right` (Show), add an `Edit` entry for the new pages-edit wrapper.
- `frontend/assets/js/components/common/show_page/show_types/configs/characterDocumentShowType.js` — move `CharacterDocumentPagesBox` from `bottom` to `right`.
- `frontend/assets/js/components/resources/document/pages/helpers/GameDocumentEditHelper.jsx` — remove the separate pages-editor container; feed pages-edit wiring into `ShowPageLayout`'s `context` instead.
- `frontend/assets/js/components/resources/document/pages/elements/edit/DocumentPagesEditSlot.jsx` (new) — wrapper combining `DocumentPagesEditBox`, the Save button, and `DocumentPagesSaveFailedAlert`, reading its wiring off `ShowPageLayout`'s merged context.
- Corresponding specs listed in Step 5.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- No backend, permissions, or API changes — this is purely a frontend layout reorganization; `canUploadPhoto`/`canEditPages` gating logic is unchanged, only where the gated content renders.
- The `left`/`right` column split stays 4/8 (`col-md-4`/`col-md-8`) per the issue's decided scope — do not rebalance column widths.
- `bottom`'s remaining shortlist content (`DocumentFilesPreview`/`DocumentPhotosPreview`, `CharacterDocumentFilesPreview`/`CharacterDocumentPhotosPreview`) is unchanged in presence and order.
- The exact shape of the new edit-mode wrapper component (Step 2) is a judgment call for whoever implements this — the plan fixes the *behavior* (pages editor + Save + failure alert grouped in the right column) but not necessarily the exact file/component boundaries.
