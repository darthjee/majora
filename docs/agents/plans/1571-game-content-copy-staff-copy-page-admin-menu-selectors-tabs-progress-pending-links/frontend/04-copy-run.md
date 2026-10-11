# Sequential copy run, progress and re-copy confirmation

- `StaffCopyActions` (outcome-returning, like `StaffPhotoActions`): `copy(type, id, target)` → `{ok, status, data}`; `link(link)` → `UploadClient.linkUpload(...)` → `{ok, status}`.
- Before the run, if any selected row has `copied_to_target: true`, show `StaffCopyConfirmModal` (modeled on `StaffPhotoConfirmModal`). Cancel aborts the whole run. Accept runs everything selected.
- Run (in the controller), strictly sequential:
  1. For each selected entity: `POST copy`. On `201`, mark it copied and run its `links` one by one through `link()`, tracking per-file `pending → linking → linked | failed`. On failure, map the status to `entity_error.*` (`404` → `not_found`, `422` → `name_taken`, `400` → `bad_request`, other/network → `unknown`).
  2. Never stop on a failure.
  3. After the run (or right after a `404`, at the end of the run), refresh the source list, and always refresh the pending-links list.
- Guard `beforeunload` while running (like the photos page). Leaving mid-run leaves links pending. They then show in the pending-links list.
- `StaffCopyProgress`: running counter (`progress`), then a per-entity result list with its per-file statuses.
- Specs: confirmation shown/not shown, cancel, all-success run, entity failure mapping, link failure not stopping the run, list refresh on `404`, unmount mid-run ignored by the safe setters.

## Files to Change
- `.../staff_copy/pages/controllers/StaffCopyActions.js` — new.
- `.../staff_copy/pages/controllers/StaffCopiesController.js` — run logic.
- `.../staff_copy/pages/helpers/StaffCopyErrors.js` — status → key mapping.
- `.../staff_copy/pages/elements/StaffCopyConfirmModal.jsx`, `StaffCopyProgress.jsx` — new.
- Matching specs.
