# Plan: Frontend: client-side photo resize and bulk Resize / Delete on the staff photos page

Issue: [1474-frontend-client-side-photo-resize-and-bulk-resize-delete-on-the-staff-photos-page.md](../../issues/1474-frontend-client-side-photo-resize-and-bulk-resize-delete-on-the-staff-photos-page.md)

## Overview

Add a browser-side **Resize** action to the staff photos page (#1473). It fits a photo inside a `max_dimension` × `max_dimension` box on a canvas, keeps the original format and never upscales, then uploads the result through the existing staff Replace flow. Also add per-page multi-select with bulk **Resize** / **Delete**: a single confirmation, sequential execution, progress plus a `beforeunload` guard, and a final done / skipped / failed summary. No backend or proxy change is needed, because #1470–#1472 already provide every endpoint.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

All new strings live in the existing `staff_photos_page` namespace (`frontend/assets/i18n/en/staff_photos_page.yaml` and `frontend/assets/i18n/pt/staff_photos_page.yaml`). No new namespace file is needed. The `frontend` agent uses exactly these keys, and the `translator` agent adds them to every language:

```yaml
staff_photos_page:
  # columns / selection
  select_column: Select
  select_photo: Select photo
  select_all_page: Select all on this page
  bulk_selected: '{{count}} selected'
  # actions
  resize: Resize
  bulk_resize: Resize selected
  bulk_delete: Delete selected
  confirm: Confirm
  cancel: Cancel
  # single resize confirmation
  resize_confirm_title: Resize photo
  resize_confirm_body: 'This photo will be resized so its longest side is at most {{max}} px. The original file is overwritten.'
  # bulk confirmation
  bulk_confirm_resize_title: Resize photos
  bulk_confirm_resize_body: '{{count}} photos will be resized so their longest side is at most {{max}} px. The original files are overwritten.'
  bulk_confirm_delete_title: Delete photos
  bulk_confirm_delete_body: '{{count}} photos will be permanently deleted.'
  # progress / summary
  bulk_progress: 'Processing {{done}} of {{total}}...'
  summary_title: Results
  summary_resized: Resized
  summary_deleted: Deleted
  summary_skipped: Skipped
  summary_failed: Failed
  summary_close: Close
  # skip reasons (bulk summary and single-resize info message)
  skip_already_small: The photo is already within the size limit.
  skip_gif: GIF photos are not resized.
  skip_not_ready: The photo is not ready.
  skip_no_path: The photo has no file path.
  skip_replace_in_progress: A replace is in progress for this photo.
  # resize-specific failures
  error_resize_load_failed: The image could not be loaded.
  error_resize_encode_failed: The image could not be resized.
```

Placeholders follow the existing `Translator.t(key).replace('{{count}}', n)` convention. Existing keys (`error_replace_in_progress`, `error_path_missing`, `error_delete_replace_in_progress`, `error_not_found`, `error_generic`) are reused as the failure reasons for 409 / 422 / 404 / other responses via `staffPhotoErrorKey`.
