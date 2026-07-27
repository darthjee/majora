# Translator Plan: Files should have a name and a Photo

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend's file-upload modal needs a label/placeholder string for a new
name input, scoped to the existing `file_upload_modal` namespace only (the
plain photo-upload modal doesn't show this input, so `photo_upload_modal`
is untouched).

## Implementation Steps

### Step 1 — Add the new key

In both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`,
add a new key under the existing `file_upload_modal:` block, e.g.:

```yaml
file_upload_modal:
  cancel: Cancel
  confirm: Confirm
  error: Failed to upload file. Please try again.
  name_label: Name
  submit: Upload
  title: Upload File
```

(`name_label` is a suggested key name — keep it consistent with this
project's existing terse label style, e.g. compare `title`/`submit` above.
Do not add it to `photo_upload_modal`.)

Portuguese equivalent (`pt.yaml`), matching the existing translated tone of
that block:

```yaml
file_upload_modal:
  name_label: Nome
```

(merged into the existing block at the same relative position, keeping keys
alphabetically ordered if that's the file's existing convention — check
before inserting.)

### Step 2 — Verify sync

Run the i18n sync check (`npm run check_i18n` inside `frontend/`, or
whatever local command backs the `frontend-checks` CI job) to confirm both
locale files stay in sync after the addition.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `file_upload_modal.name_label`
- `frontend/assets/i18n/pt.yaml` — add `file_upload_modal.name_label`

## CI Checks

- `frontend/`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Coordinate the exact key name with `frontend.md`'s Step 2 before the
  frontend agent wires up `Translator.t()`, to avoid a mismatched-key churn
  cycle.
