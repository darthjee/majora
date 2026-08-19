# Frontend Plan: Refactor common_item/document/game/staff_user/stl_model/treasure components flagged as too long (Lizard nloc-medium)

Main plan: [plan.md](plan.md)

## Overview

Codacy's Lizard complexity analyzer flags 8 methods across 8 files as exceeding 50 NLOC. This is a pure refactor — no behavior, DOM structure (`data-testid` etc.), or props/contract changes — so existing Jasmine specs must keep passing unmodified except for import/structure adjustments forced by moving JSX into new files. The 8 occurrences split into two shapes needing two different extraction techniques (decided during issue discussion, see the issue's Solution section):

- **Group 1** — 3 rendering-helper classes with one oversized static `render` method. Fix: extend the private static `#renderX()` sub-method pattern already used by `TreasureFiltersHelper` (`#renderGameType`) and `StlModelNewHelper` (`#renderError`, `#renderPhotoUploadFailed`) to the remaining oversized methods.
- **Group 2** — 5 page components whose bulk is inline modal JSX (2-4 modals each), not form markup (the form itself is already delegated to a `*Helper.render()` call). Fix: extract a `<PageNameModals>` sub-component per page into that resource's existing `pages/elements/` folder (confirmed already populated with sibling components like `document/pages/elements/GiveDocumentModal.jsx` and `game/pages/elements/PollCloseModal.jsx` — same folder, same convention).

## Implementation Steps

### Step 1 — `StaffUsersFiltersHelper.render` (Group 1)

`frontend/assets/js/components/resources/staff_user/pages/elements/helpers/StaffUsersFiltersHelper.jsx:16` (55 lines). Split the single `render` method into private static sub-methods per filter field group, mirroring `TreasureFiltersHelper`'s `#renderGameType` shape (same signature style: takes `state`/`handlers`, returns a `<div className="col-auto">...</div>` fragment):

- `#renderStatusFilter(state, handlers)` — the Status `<select>` block
- `#renderSearchFilter(state, handlers)` — the Search `<input>` block
- `#renderActions(handlers)` — the Query + Clear buttons

`render` becomes a thin wrapper composing these three inside the existing outer `<div className="row g-2 align-items-end mb-4" data-testid="staff-users-filters">`.

### Step 2 — `TreasureFiltersHelper.render` (Group 1)

`frontend/assets/js/components/resources/treasure/pages/elements/helpers/TreasureFiltersHelper.jsx:21` (64 lines). Already has `#renderGameType` extracted; that alone isn't enough. Extract the remaining field groups the same way:

- `#renderMinMaxValue(state, handlers)` — Min/Max value inputs
- `#renderNameFilter(state, handlers)` — Name text input
- `#renderActions(handlers)` — Query + Clear buttons

Keep the existing `#renderGameType` as-is; `render` composes all four inside the existing outer `<div>`.

### Step 3 — `StlModelNewHelper.render` (Group 1)

`frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx:41` (64 lines). Already has `#renderError`/`#renderPhotoUploadFailed` extracted for the banners; the main two-column form body is what's still oversized. Extract:

- `#renderLeftColumn(formState, handlers)` — photo field, name field, owned switch, and the `StlModelFormFieldsHelper.render(...)` call (type/races/roles/url/size)
- `#renderRightColumn(formState, handlers)` — tags field, source picker, collection picker

`render` composes `<div className="row">` wrapping both column methods, unchanged outer shell (back button, title, error/failed banners, submit button).

### Step 4 — `GameCommonItemEdit` modals (Group 2)

`frontend/assets/js/components/resources/common_item/pages/GameCommonItemEdit.jsx:24` (57 lines). Extract the `<PhotoUploadModal>` + `<MoneyEditModal>` block (lines ~92-107 in the current file) into a new `common_item/pages/elements/GameCommonItemEditModals.jsx`, taking the show-flags (`showUploadModal`, `showPriceModal`), derived `uploadPath`, `fields.price`, and the relevant handlers/setters as props. `GameCommonItemEdit` renders `{CommonItemEditHelper.render(...)}` followed by `<GameCommonItemEditModals ... />` in its returned fragment.

### Step 5 — `GameCommonItemNew` modals (Group 2)

`frontend/assets/js/components/resources/common_item/pages/GameCommonItemNew.jsx:20` (55 lines). Same technique: extract the `<PhotoUploadModal deferred ...>` + `<MoneyEditModal>` block into `common_item/pages/elements/GameCommonItemNewModals.jsx`, taking `showUploadModal`, `showPriceModal`, `fields.price`, and the relevant handlers/setters (`setPhotoFile`, `setField`, etc.) as props.

### Step 6 — `GameDocument` modals (Group 2)

`frontend/assets/js/components/resources/document/pages/GameDocument.jsx:38` (64 lines, the largest of the group — 4 modals: 2x `PhotoUploadModal`, `PhotoViewModal`, `GiveDocumentModal`). Extract all four into `document/pages/elements/GameDocumentModals.jsx`, taking the show-flags, `document`, `gameSlug`, `canGiveHidden`, `selectedPhoto`, the derived `uploadPath`/`fileUploadPath`/`buildFilePhotoUploadPath`, and the close/success handlers (including `buildUploadSuccessHandler`, which can stay in the page or move with the modals — pick whichever keeps the new component's prop list smallest) as props. Note: `document/pages/elements/GiveDocumentModal.jsx` already exists as the modal component itself — this step only extracts the *wiring* block from `GameDocument.jsx`, it does not touch `GiveDocumentModal.jsx`.

### Step 7 — `GameEdit` modals (Group 2)

`frontend/assets/js/components/resources/game/pages/GameEdit.jsx:33` (53 lines). Extract the `<PhotoUploadModal>` + `<LinksEditModal>` block into `game/pages/elements/GameEditModals.jsx`, taking `showUploadModal`, `showLinksModal`, `gameSlug`, `links`, and the relevant handlers/setters as props.

### Step 8 — `StlModelNew` modals (Group 2)

`frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx:45` (57 lines). Extract the single `<PhotoUploadModal deferred ...>` block into `stl_model/pages/elements/StlModelNewModals.jsx`, taking `showUploadModal`, `setPhotoFile`, and the close handler as props. Note: `buildTagsAfterAdd` (the exported helper at the top of this file) is unrelated to the flagged method and must **not** be touched by this refactor.

## Files to Change

- `frontend/assets/js/components/resources/staff_user/pages/elements/helpers/StaffUsersFiltersHelper.jsx` — split `render` into `#renderStatusFilter`/`#renderSearchFilter`/`#renderActions`
- `frontend/assets/js/components/resources/treasure/pages/elements/helpers/TreasureFiltersHelper.jsx` — split `render` into `#renderMinMaxValue`/`#renderNameFilter`/`#renderActions` (alongside existing `#renderGameType`)
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx` — split `render`'s two-column body into `#renderLeftColumn`/`#renderRightColumn`
- `frontend/assets/js/components/resources/common_item/pages/GameCommonItemEdit.jsx` — delegate modals to new sub-component
- `frontend/assets/js/components/resources/common_item/pages/elements/GameCommonItemEditModals.jsx` — new: `PhotoUploadModal` + `MoneyEditModal` wiring
- `frontend/assets/js/components/resources/common_item/pages/GameCommonItemNew.jsx` — delegate modals to new sub-component
- `frontend/assets/js/components/resources/common_item/pages/elements/GameCommonItemNewModals.jsx` — new: `PhotoUploadModal` (deferred) + `MoneyEditModal` wiring
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — delegate modals to new sub-component
- `frontend/assets/js/components/resources/document/pages/elements/GameDocumentModals.jsx` — new: 2x `PhotoUploadModal` + `PhotoViewModal` + `GiveDocumentModal` wiring
- `frontend/assets/js/components/resources/game/pages/GameEdit.jsx` — delegate modals to new sub-component
- `frontend/assets/js/components/resources/game/pages/elements/GameEditModals.jsx` — new: `PhotoUploadModal` + `LinksEditModal` wiring
- `frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx` — delegate modal to new sub-component
- `frontend/assets/js/components/resources/stl_model/pages/elements/StlModelNewModals.jsx` — new: `PhotoUploadModal` (deferred) wiring
- Any specs under `frontend/specs/` that directly reference the moved JSX/markup (expected to be none, since `data-testid`s and rendered output stay identical — only worth touching if a spec imports internals rather than testing rendered output)

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`) — catches unused imports/vars left behind by the extraction
- `frontend`: `npm run coverage` (CI job: `jasmine`) — full Jasmine suite + coverage; must stay green since no behavior changes
- Codacy Lizard (server-side, not a local script) — re-run via the Codacy MCP tools if available, or confirm by eyeballing method length, since there's no local Lizard invocation in this repo's `package.json`/CI config

## Notes

- Each extracted method/sub-component should be verified against the 50-NLOC limit individually — don't just get the parent method under budget while leaving an extracted piece still oversized.
- For Group 2, prefer passing already-derived values (e.g. `uploadPath`) as props rather than re-deriving them inside the new sub-component, to avoid duplicating logic that lives in the controller/page.
- No new tests are required by the Definition of Done for this kind of refactor (existing specs already cover the rendered behavior via `data-testid`/output), but if any spec turns out to import a helper method/sub-component directly (rather than testing through the page), it may need updating to the new structure.
