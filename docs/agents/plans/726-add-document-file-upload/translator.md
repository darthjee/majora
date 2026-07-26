# Translator Plan: Add document file upload

Main plan: [plan.md](plan.md)

## Shared contracts

- New i18n key block `file_upload_modal`, mirroring the existing `photo_upload_modal` block's shape (`cancel`, `confirm`, `error`, `submit`, `title`), consumed by the frontend agent's parametrized upload modal (`translationPrefix="file_upload_modal"`).

## Implementation Steps

### Step 1 — Add `file_upload_modal` block to both language files
In `frontend/assets/i18n/en.yaml`, add (near the existing `photo_upload_modal` block, alphabetically ordered per the file's convention):
```yaml
file_upload_modal:
  cancel: Cancel
  confirm: Confirm
  error: Failed to upload file. Please try again.
  submit: Upload
  title: Upload File
```
In `frontend/assets/i18n/pt.yaml`:
```yaml
file_upload_modal:
  cancel: Cancelar
  confirm: Confirmar
  error: Falha ao enviar arquivo. Por favor, tente novamente.
  submit: Enviar
  title: Enviar Arquivo
```

### Step 2 — Verify key sync
Run the project's translation-key-sync check script (the one referenced by this agent's scope) to confirm both language files stay in sync after the addition.

## Files to Change
- `frontend/assets/i18n/en.yaml` — add `file_upload_modal` block.
- `frontend/assets/i18n/pt.yaml` — add `file_upload_modal` block.

## CI Checks
- `frontend`: translation key sync check (if wired into CI — check `.circleci/config.yml`'s `frontend-checks` job for whether it includes this script).

## Notes
- Depends on the frontend agent finalizing the key prefix name (`file_upload_modal`) and the exact set of sub-keys before wording is finalized — coordinate if the frontend plan changes the prop/prefix name.
- These are the only 2 language files in the repo (`en.yaml`, `pt.yaml`) — no other locales to update.
