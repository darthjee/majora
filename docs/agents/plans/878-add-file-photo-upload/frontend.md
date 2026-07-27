# Frontend Plan: Add file photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

- Backend's `file_upload.json` init response will gain an `id` key equal to the newly created `GameDocumentFile`'s id (in addition to the existing `document_id`) — depend on backend Step 1/5 landing first, or coordinate to land together.
- New backend endpoint `POST /games/:game_slug/documents/:document_id/files/:file_id/photo_upload.json` returns `201 { upload_id, token, upload_type: "image", file_id }` on init; finish via the existing generic `POST /uploads/:upload_type/:id/submit.json`.
- i18n keys this component references (see [translator.md](translator.md)): `file_upload_modal.photo_label` at minimum; reuse `file_upload_modal.error` unless a distinct photo-step error message is added as `file_upload_modal.photo_error`. Finalize exact key names with the translator agent before/while implementing.

## Implementation Steps

### Step 1 — Add a resourceConfig path for the file-photo-upload endpoint

In `frontend/assets/js/utils/requests/config/documentConfig.js`, add a path builder taking `gameSlug`, `documentId` (or reuse `id`, whatever the file already uses for the document id), and `fileId`:

```js
const documentFilePhotoUploadPath = ({ gameSlug, documentId, fileId }) =>
  `/games/${gameSlug}/documents/${documentId}/files/${fileId}/photo_upload.json`;
```

mirroring `characterPhotoUploadPath` in `frontend/assets/js/utils/requests/config/itemConfig.js` (same two-id shape). Register it under `POST` for a resource/quantityType pair the rest of the config expects (e.g. `document`/`filePhoto`, or nested under `file` with a new quantity type) — follow whatever naming convention `documentConfig.js` already uses for its other entries.

### Step 2 — Extend `PhotoUploadModal` with an optional photo field

`frontend/assets/js/components/common/modals/PhotoUploadModal.jsx` already supports `showNameField` (added in #874) for the file-upload variant. Add a parallel `showPhotoField` prop (or reuse a single new prop that implies both, per how `GameDocument.jsx` already distinguishes the two `PhotoUploadModal` instances via `translationPrefix="file_upload_modal"`). When enabled, render a second, optional file `<input>` (image accept types) below the existing file/name inputs, tracked as local `photo`/`photoFile` state, and forward it to the controller's submit call.

### Step 3 — Extend `PhotoUploadModalHelper`

`frontend/assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx` — add a `#renderPhotoField`-style method (parallel to the existing `#renderNameField`) that renders the optional photo input when `showPhotoField` is set, labeled via the new `file_upload_modal.photo_label` i18n key.

### Step 4 — Chain the second upload in `PhotoUploadModalController.handleSubmit`

`frontend/assets/js/components/common/modals/controllers/PhotoUploadModalController.js` — extend `handleSubmit` to accept the optional photo file, and after the first init+submit cycle succeeds:

1. Destructure `id` (the new file's id, per backend Step 1/5 above) from the first init response's JSON, alongside the existing `upload_id`/`token`/`upload_type`.
2. If a photo file was provided, build the photo-upload path via Step 1's resourceConfig entry (using the returned file id + `documentId`/`gameSlug` already known by the caller), then run a second `initUpload`/`submitUpload` cycle against it (same shape as the first, reusing `this.client.initUpload`/`this.client.submitUpload`).
3. Only call `this.setUploading(false)` / `this.onSuccess()` after both cycles (or the single cycle, if no photo was selected) complete. Surface a distinct error state for a failure in the second cycle if the UI needs to disambiguate which step failed (use `file_upload_modal.photo_error` if added, else `file_upload_modal.error`).

This is the first place in the frontend chaining two upload init+submit cycles from one submit action — keep the sequencing simple (await the first fully before starting the second) rather than parallelizing, since the second depends on the first's result (`file_id`).

### Step 5 — Wire it up in `GameDocument.jsx`

`frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — pass the new `showPhotoField` prop (and any additional path-building props the controller needs, e.g. `documentId`/`gameSlug`) to the existing `showFileUploadModal` instance of `PhotoUploadModal`. No changes needed to the document-photo `PhotoUploadModal` instance (index 0).

## Files to Change

- `frontend/assets/js/utils/requests/config/documentConfig.js` — add the file-photo-upload path builder + registration.
- `frontend/assets/js/components/common/modals/PhotoUploadModal.jsx` — add `showPhotoField` support.
- `frontend/assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx` — render the optional photo input.
- `frontend/assets/js/components/common/modals/controllers/PhotoUploadModalController.js` — chain the second upload cycle.
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — pass the new props to the file-upload modal instance.
- Matching specs: `frontend/specs/**/PhotoUploadModalSpec.js`, `.../PhotoUploadModalController/handleSubmitSpec.js`, `.../PhotoUploadModalHelperSpec.js`, `.../GameDocumentFileUploadModalSpec.js` (all already exist per #874's diff — extend them for the new optional-photo behavior, including the chained-upload success and photo-step-failure cases).

## CI Checks

- `frontend`: `npm run coverage` (job `jasmine`, runs `nyc npx jasmine "specs/**/*[sS]pec.js"`) — via `docker-compose run --rm frontend npm run coverage`.
- `frontend`: `npm run lint` (job `frontend-checks`, `eslint assets specs`) and `npm run check_i18n` (same job) — the latter will fail until the translator agent's keys land, so land translator's change first or together.

## Notes

- Confirm the exact resourceConfig resource/quantityType key naming with existing `documentConfig.js` conventions before adding — avoid guessing a shape that doesn't fit the file's existing `RESOURCES` structure.
- No redux/saga layer is used for this upload flow (confirmed: `GameDocument.jsx` wires `PhotoUploadModal` directly, no dispatch/saga involved) — despite the issue text describing a "Saga", this is plain async/await inside the controller, consistent with the rest of the upload-modal code.
