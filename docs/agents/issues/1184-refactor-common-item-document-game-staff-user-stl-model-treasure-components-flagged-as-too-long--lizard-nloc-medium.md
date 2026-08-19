# Issue: Refactor common_item/document/game/staff_user/stl_model/treasure components flagged as too long (Lizard nloc-medium)

## Description

Sub-issue of #1167 (itself a sub-issue of #1152). Codacy's `Lizard` complexity analyzer flags 8 methods across 8 files under `frontend/assets/js/components/resources/{common_item,document,game,staff_user,stl_model,treasure}/` as exceeding the 50-NLOC-per-method limit.

## Problem

These components mix several concerns (markup for multiple sections, or multiple filter/form fields) in one long method, making them harder to read and maintain.

## Expected Behavior

Each method below drops back under its 50-NLOC limit through genuine sub-responsibility extraction — split components into smaller sub-components or extracted render helpers — following the project's existing pattern, per the Definition of Done strengthened in #1152.

## Solution

For each occurrence, identify the distinct sections/responsibilities being mixed together and extract them into well-named helper methods or sub-components.

### Occurrences (8, across 8 files)

- `frontend/assets/js/components/resources/common_item/pages/GameCommonItemEdit.jsx`
  - line 24: Method GameCommonItemEdit has 57 lines (limit 50)
- `frontend/assets/js/components/resources/common_item/pages/GameCommonItemNew.jsx`
  - line 20: Method GameCommonItemNew has 55 lines (limit 50)
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx`
  - line 38: Method GameDocument has 64 lines (limit 50)
- `frontend/assets/js/components/resources/game/pages/GameEdit.jsx`
  - line 33: Method GameEdit has 53 lines (limit 50)
- `frontend/assets/js/components/resources/staff_user/pages/elements/helpers/StaffUsersFiltersHelper.jsx`
  - line 16: Method render has 55 lines (limit 50)
- `frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx`
  - line 45: Method StlModelNew has 57 lines (limit 50)
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx`
  - line 41: Method render has 64 lines (limit 50)
- `frontend/assets/js/components/resources/treasure/pages/elements/helpers/TreasureFiltersHelper.jsx`
  - line 21: Method render has 64 lines (limit 50)

### Extraction approach per group

The 8 occurrences split into two genuinely different shapes, each with its own fix — there's no single uniform pattern that fits both:

**Group 1 — Helper classes with one oversized `render` method** (`StaffUsersFiltersHelper`, `TreasureFiltersHelper`, `StlModelNewHelper`): these already follow an in-file pattern — `TreasureFiltersHelper` and `StlModelNewHelper` already extract private static `#renderX()` sub-methods for individual sections (e.g. `#renderGameType`, `#renderError`, `#renderPhotoUploadFailed`). The fix is to extend that same pattern to the remaining oversized `render` methods:
- `StaffUsersFiltersHelper.render` → split into `#renderStatusFilter` / `#renderSearchFilter` / `#renderActions`
- `TreasureFiltersHelper.render` → split similarly if still over budget once other extractions land
- `StlModelNewHelper.render` → split into `#renderLeftColumn` / `#renderRightColumn` (photo/name/owned/type fields vs. tags/source/collection pickers)

**Group 2 — Page components whose bulk is modal-wiring, not form JSX** (`GameCommonItemEdit`, `GameCommonItemNew`, `GameDocument`, `GameEdit`, `StlModelNew`): these already delegate the form itself to a `*Helper.render()` call. What pushes them past 50 NLOC is state/effects/handlers plus 2–4 inline modal JSX blocks in the return (e.g. `GameDocument` has four: two `PhotoUploadModal`s, `PhotoViewModal`, `GiveDocumentModal`). No existing precedent in the codebase groups multiple modals into one sub-component, so this was a genuine choice between two options:
- (a) Extract a `<PageNameModals>` sub-component per page, placed in that resource's existing `pages/elements/` folder (already present for all 4 of these resources), taking the relevant show-flags/paths/handlers as props. Keeps state ownership in the page, just moves modal markup out.
- (b) Extract a custom hook (e.g. `useUploadModal`) bundling state + handler logic per modal — more invasive, changes where state lives.

**Decision:** go with (a) for Group 2 — smaller diff, no state-ownership changes, fits the existing `pages/elements/` folder convention already used in these directories. Group 1 extends the existing `#renderX` private-static-method pattern with no alternative considered, since it's a direct continuation of the codebase's own convention.

## Benefits

Improved readability, reusability, and testability of these resource-page components; passes the Codacy Lizard check.
