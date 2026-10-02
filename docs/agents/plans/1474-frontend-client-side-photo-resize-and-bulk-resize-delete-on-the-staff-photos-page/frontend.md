# Frontend Plan: Frontend: client-side photo resize and bulk Resize / Delete on the staff photos page

Main plan: [plan.md](plan.md)

## Shared contracts

- **i18n**: use only the `staff_photos_page.*` keys listed in [plan.md](plan.md#shared-contracts) (added by the `translator` agent), plus the existing `error_*` keys through `staffPhotoErrorKey`.
- **API (already merged, #1470)**:
  - `GET /staff/photos.json` → `{max_dimension, types}`. `maxDimension` is already in page state.
  - `GET /staff/photos/<type>.json` → rows `{id, path, ready, replace_in_progress, owner}`.
  - `POST /staff/photos/<type>/<id>/replace.json` → upload cycle via `UploadClient#runUploadCycle(path, file, token)`. 409 means a replace is in progress, 422 means the path is missing, 404 means not found.
  - `DELETE /staff/photos/<type>/<id>.json` → 422 means a replace is in progress, 404 means not found.

## Steps

- [01 — Resize helper](frontend/01-resize-helper.md)
- [02 — Controller: single resize and the sequential bulk runner](frontend/02-controller-resize-and-bulk.md)
- [03 — Row Resize action, selection and bulk action bar](frontend/03-selection-and-row-actions.md)
- [04 — Confirmation modals, progress and result summary](frontend/04-modals-progress-summary.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- Specs run in Node Jasmine with **no DOM**, and no existing code uses canvas. The resize helper must therefore take its browser primitives (image loader, canvas factory) as injectable dependencies with browser defaults, so the specs can stub them. Follow this pattern wherever `window` (`beforeunload`) is touched.
- `beforeunload`: browsers ignore custom text, so only call `event.preventDefault()` and set `event.returnValue = ''`. No translation key is needed for it.
- Load the source image from `photo.path` (same origin through the proxy, so the canvas is not tainted). #1471 makes `/photos/*` revalidate, so a freshly replaced file is not served stale. Still, append the recorded cache-busting version (`staffPhotoThumbnailSrc`) when one exists.
- Resize overwrites the original. The extension is unchanged, so the proxy (#1472) overwrites it in place atomically.
