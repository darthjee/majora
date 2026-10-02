# Request config and UploadClient status

Add the `staffPhoto` request resource and make `UploadClient.runUploadCycle` report the HTTP status so the page can tell 409 / 422 / 404 apart.

- New `staffPhotoConfig.js`, modelled on `staffUserConfig.js` (each entry `{ path, permission: null }`, `regular` and `private` pointing at the same object):
  - `GET.index` → `/staff/photos.json`
  - `GET.collection` → `({ photoType }) => /staff/photos/${photoType}.json`
  - `DELETE.single` → `({ photoType, id }) => /staff/photos/${photoType}/${id}.json`
- Register it as `staffPhoto` in `RESOURCES` in `resourceConfig.js` (and the JSDoc resource list). No `RequestPermissionResolvers` entry is needed (falls back to no permissions).
- `UploadClient.runUploadCycle`: return `{ ok: false, status: initResponse.status }` when init fails, and `{ ok: submitResponse.ok, status: submitResponse.status, ...initData }` otherwise (status before the spread). Existing callers (`PhotoUploadSaga`, `PhotoUploadModalController`) only read `ok`/`id` and keep working.

## Files to Change

- `frontend/assets/js/utils/requests/config/staffPhotoConfig.js` — new
- `frontend/assets/js/utils/requests/resourceConfig.js` — register `staffPhoto`
- `frontend/assets/js/client/UploadClient.js` — add `status` to the result
- `frontend/specs/assets/js/utils/requests/resourceConfigStaffPhotoSpec.js` — new (pattern: `resourceConfigMutations842Spec.js`)
- `frontend/specs/assets/js/client/UploadClient/runUploadCycleSpec.js` — update expectations to include `status`
