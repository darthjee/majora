# Translator Plan: Add file photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

Frontend (see [frontend.md](frontend.md)) will reference new i18n keys under the existing `file_upload_modal` block for the optional photo field: at minimum `file_upload_modal.photo_label`. It may also reference `file_upload_modal.photo_error` if a distinct error message is needed for a failure in the second (photo) upload cycle, as opposed to `file_upload_modal.error` for the first (file) cycle. Coordinate exact final key names with the frontend agent's implementation.

## Implementation Steps

### Step 1 — Add the new keys to both locale files

In `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`, extend the existing `file_upload_modal` block (currently `cancel`, `confirm`, `error`, `name_label`, `submit`, `title`, around lines 60-72) with:

- `photo_label` — label for the optional photo field (e.g. English: "Photo (optional)").
- `photo_error` — only if frontend confirms it needs a distinct error string for the second upload step; otherwise omit and let frontend reuse `error`.

Keep both files' key sets identical — `npm run check_i18n` enforces parity between locales.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `file_upload_modal.photo_label` (and `photo_error` if needed).
- `frontend/assets/i18n/pt.yaml` — same keys, Portuguese translations.

## CI Checks

- `frontend`: `npm run check_i18n` (job `frontend-checks`) — verifies key parity across locale files.

## Notes

- Land this alongside or before the frontend change, since `check_i18n`/lint will fail if the frontend references a key that doesn't exist yet in both files.
