# Translator Plan: Frontend: client-side photo resize and bulk Resize / Delete on the staff photos page

Main plan: [plan.md](plan.md)

## Shared contracts

Add exactly the keys below under `staff_photos_page`, in both `en` and `pt`, keeping the `{{count}}` / `{{max}}` / `{{done}}` / `{{total}}` placeholders verbatim:

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

## Implementation Steps

### Step 1 — Add the staff photos resize / bulk keys

Append the keys above to `frontend/assets/i18n/en/staff_photos_page.yaml` (English text as given) and to `frontend/assets/i18n/pt/staff_photos_page.yaml` (Portuguese translations, same keys and placeholders). The namespace file already exists in both languages, so the `index.js` manifests don't change.

## Files to Change

- `frontend/assets/i18n/en/staff_photos_page.yaml` — new keys.
- `frontend/assets/i18n/pt/staff_photos_page.yaml` — new keys (Portuguese).

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)
