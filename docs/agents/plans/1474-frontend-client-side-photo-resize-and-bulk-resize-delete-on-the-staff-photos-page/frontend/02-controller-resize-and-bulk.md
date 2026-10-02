# Controller: single resize and the sequential bulk runner

Extend `StaffPhotosController` so single actions can also report an **outcome**, and add a bulk runner that chains them.

- Refactor the single-photo actions into outcome-returning private methods, so the single-click path and the bulk path share one code path:
  - `#deletePhoto(photo)` → `{ status: 'done' }` or `{ status: 'failed', reason: staffPhotoErrorKey('delete', status) }`, with network errors mapped to `error_generic`;
  - `#resizePhoto(photo)` → `StaffPhotoResizer.resize(photo, this.maxDimension)`. When it returns `resized`, upload the file with `UploadClient#runUploadCycle(this.replacePath(photo), file, AuthStorage.getToken())`; a non-ok response maps through `staffPhotoErrorKey('replace', status)`.
  - Keep `this.maxDimension` on the controller, set in `#applyIndex`.
- `handleDelete(photo)` keeps today's behaviour on top of `#deletePhoto`.
- New `handleResize(photo)`:
  - on `done`, use the same bookkeeping as `handleReplaceSuccess` (purge, version bump, refetch);
  - on `skipped`, set a new `actionInfo` state to `staff_photos_page.<reason>`;
  - on `failed`, set `actionError` (a 404 also purges and refetches, as today).
- New `runBulk(action, photos)`, where `action` is `'resize'` or `'delete'`:
  - process the photos **one at a time** with `for … of` + `await`; a failure never stops the loop;
  - before starting, set `bulkJob` state to `{ action, total, done: 0 }` and add a `beforeunload` listener;
  - after each photo, increment `done` and record `{ photo, status, reason }`. Successful resizes record a version bump;
  - at the end, remove the listener, set `bulkJob` to `null` and `bulkResult` to `{ action, outcomes }`, purge the list cache and refetch once.
  - The listener target (`window`) is injectable through the constructor (default `globalThis.window`), so specs run without a DOM. Remove the listener on unmount too, via the effect cleanup.
- New setters: `setActionInfo`, `setBulkJob`, `setBulkResult`. Wire them in `useStaffPhotosState` (`StaffPhotos.jsx`), and clear `actionInfo` together with `actionError` at the start of every action.

Specs: single resize (done / skipped / failed, including 409 and 422), bulk resize and bulk delete with mixed outcomes (a failure in the middle continues), progress updates, adding and removing the `beforeunload` listener, and a single refetch at the end.

## Files to Change

- `frontend/assets/js/components/resources/staff_photo/pages/controllers/StaffPhotosController.js` — outcome methods, `handleResize`, `runBulk`, new setters, `maxDimension`, unload guard.
- `frontend/assets/js/components/resources/staff_photo/pages/StaffPhotos.jsx` — new state (`actionInfo`, `bulkJob`, `bulkResult`) wired into the hook.
- `frontend/specs/assets/js/components/resources/staff_photo/pages/controllers/StaffPhotosControllerSpec.js` — new or extended specs (create it if it doesn't exist).
