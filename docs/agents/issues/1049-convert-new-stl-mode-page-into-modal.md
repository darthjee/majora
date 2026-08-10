# Issue: Convert new stl_mode page into modal

## Description

The STL model frontend pages need two related changes:

1. **Fix URL scoping**: the STL model routes currently live at the top level (`/#/stl_models...`) even though the backend already treats STL models as one resource inside a broader `miniatures` domain (`backend/miniatures/`, alongside `source`, `tag`, `stl_model_link`, `stl_model_photo`). The routes should move under `/#/miniatures/...` to match.
2. **Convert the "new STL model" page into a modal**: `/#/stl_models/new` is currently a small standalone full-page form. It should become a two-column modal launched from the STL models list page instead of a separate route.

## Problem

- `/#/stl_models`, `/#/stl_models/new`, and `/#/stl_models/:id` are registered as top-level routes in `HashRouteResolver.js`, which doesn't match the backend's domain modeling (STL models are one resource inside the `miniatures` Django app) and leaves no clear place for future sibling resources (e.g. `source`, `tag`) to live in the frontend route table.
- `/#/stl_models/new` (`StlModelNew.jsx`) is a full page dedicated to a very small form (photo, name, tags). Navigating away from the list just to create a record, then getting redirected to the new item's show page, is more friction than the form's size warrants.

## Expected Behavior

- Visiting `/#/miniatures/stl_models` shows the STL models list (currently at `/#/stl_models`); visiting `/#/miniatures/stl_models/:id` shows a single STL model (currently at `/#/stl_models/:id`). The old `/#/stl_models...` URLs no longer resolve — no redirect is provided, breaking old bookmarks/links is acceptable.
- The header nav link to the STL models list points at the new `/#/miniatures/stl_models` path.
- There is no standalone "new STL model" page/route anymore. A "New STL model" button on the list page (visible to staff/superuser viewers, as today) opens a two-column modal in place.
- Submitting the modal creates the STL model (and uploads its photo, if one was picked) without ever navigating away from the list — the modal closes and the list reloads to show the new entry once creation (and photo upload, if applicable) succeeds.

## Solution

### URL restructuring

- Move the two surviving STL model routes under `/miniatures` in `HashRouteResolver.js`:
  - `/#/stl_models` → `/#/miniatures/stl_models`
  - `/#/stl_models/:id` → `/#/miniatures/stl_models/:id`
  - `/#/stl_models/new` is dropped outright, not moved (superseded by the modal below).
- No back-compat redirect for old `/#/stl_models...` URLs — not needed.
- Update the header nav link in `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` (currently hard-coded to `href="#/stl_models"`) to the new `#/miniatures/stl_models` path. No other frontend references to the old path exist.
- This mirrors the backend, where the Django app is already named `miniatures` (`backend/miniatures/`) and `stl_model` is just one model inside it alongside `source`, `tag`, `stl_model_link`, `stl_model_photo`. The `/miniatures` prefix is intentionally meant to host future sibling resources matching those backend models — don't hard-code the route table as if `stl_models` were the only child.

### Modal conversion

- Trigger: the existing "New STL model" button on `StlModels.jsx` (rendered via `StlModelsHelper` for staff/superuser viewers) opens the modal in place instead of navigating to `/stl_models/new`.
- Route: `/#/stl_models/new` (and its `/miniatures` equivalent) is dropped entirely — "new" only exists as the modal, reached via the button, not as a deep-linkable URL.
- Layout: two columns inside the modal body:
  - Left: photo field (`StlModelPhotoField`, opens `PhotoUploadModal`) + name input.
  - Right: tags field (add/remove chips) — currently the only other field on the form.
  - Submit button spans the full width as the modal's footer.

### Submit / reload behavior and photo-upload retry flow

Port `StlModelNewController.js`'s existing branching (`#performCreate` → `#handleResponse` → `#uploadPhoto`/`#failPhotoUpload`) into the modal instead of the full `/new` page — every "redirect to the show page" call becomes "close modal + reload the `stl_models` list" instead. No new states, just a different terminal action:

1. **Submit** → record creation POST (name + tags, no photo). Modal shows a submitting/disabled state.
2. **Creation fails** (400 validation, or general error) → modal stays open, shows field errors / general error banner (same as today). User can fix and resubmit.
3. **Creation succeeds, no photo was picked** → modal closes immediately, list reloads. Done.
4. **Creation succeeds, a photo was picked** → record already exists; modal stays open showing an "uploading photo…" state while the photo upload saga runs:
   - **Upload succeeds** → modal closes, list reloads (new row already has its photo).
   - **Upload fails** → modal stays open, shows the same retry/skip banner as today's `photo-upload-failed` state:
     - **Retry** → re-attempts the upload against the same created id; modal stays open.
     - **Skip** → gives up on the photo, closes the modal, reloads the list (item exists photo-less, fixable later from its show page).

## Benefits

- Frontend URL structure matches the backend's `miniatures` domain, and leaves room for future sibling resources without another route-table rework.
- Creating an STL model no longer requires leaving the list page — faster, lower-friction flow for staff/superusers, with the same safety net (retry/skip) for photo upload failures that exists today.
