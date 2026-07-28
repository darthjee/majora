# Translator Plan: Add photo deletion

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" — the `frontend` agent references these keys via `Translator.t(...)`:
- `delete_photo_confirm_modal.title`, `.body`, `.confirm`, `.cancel`
- `photo_card.delete_photo`
- `character_photos_page.delete_photo_error`

## Implementation Steps

### Step 1 — Add `delete_photo_confirm_modal` block

In `frontend/assets/i18n/en.yaml`, insert after the existing `profile_photo_set_modal` block (matching the surrounding nesting style, e.g. lines ~77-80):

```yaml
delete_photo_confirm_modal:
  title: Delete Photo
  body: Are you sure you want to delete this photo? This cannot be undone.
  confirm: Delete
  cancel: Cancel
```

In `frontend/assets/i18n/pt.yaml`, same key structure, Portuguese values:

```yaml
delete_photo_confirm_modal:
  title: Excluir Foto
  body: Tem certeza de que deseja excluir esta foto? Esta ação não pode ser desfeita.
  confirm: Excluir
  cancel: Cancelar
```

### Step 2 — Add `photo_card.delete_photo` key

Used as the delete button's tooltip/aria-label (issue specifies the tooltip text "Delete Photo"). If a `photo_card:` top-level block doesn't already exist in either file, add one near the other photo-related blocks (`photo_view_modal`, `photo_upload_modal`):

`en.yaml`:
```yaml
photo_card:
  delete_photo: Delete Photo
```

`pt.yaml`:
```yaml
photo_card:
  delete_photo: Excluir Foto
```

(If `photo_card:` already exists by the time this is implemented — check first — append `delete_photo` under the existing block instead of creating a duplicate top-level key.)

### Step 3 — Add `character_photos_page.delete_photo_error`

Check whether a `character_photos_page:` block already exists (it likely does, for the existing upload-error message). Add `delete_photo_error` alongside it:

`en.yaml`:
```yaml
character_photos_page:
  delete_photo_error: Failed to delete photo. Please try again.
```

`pt.yaml`:
```yaml
character_photos_page:
  delete_photo_error: Falha ao excluir a foto. Por favor, tente novamente.
```

### Step 4 — Verify sync

Run the check script (Step below) after editing both files — every key added to `en.yaml` must have an exact counterpart in `pt.yaml`, same nesting, no extras in either direction.

## Files to Change
- `frontend/assets/i18n/en.yaml` — new keys (Step 1-3).
- `frontend/assets/i18n/pt.yaml` — new keys (Step 1-3).

## CI Checks
- `frontend`: `npm run check_i18n` (script: `frontend/scripts/check_i18n.js`; CI job: `frontend-checks`) — fails on any key mismatch between locale files.

## Notes
- Confirm the exact key names this plan assumes (`photo_card.delete_photo`, `character_photos_page.delete_photo_error`) against whatever the `frontend` agent actually lands on — if it names things differently while implementing, update these to match before merging, since `check_i18n` only verifies keys are in sync across locales, not that they match what the frontend code references.
