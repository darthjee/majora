# Translator Plan: Frontend Photo Upload

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent's `PhotoUploadModalHelper` and `GameEditHelper` consume these translation keys via `Translator.t(...)`. This agent must provide them in both `en.yaml` and `pt.yaml`.

New namespace `photo_upload_modal`:

| Key | English value | Portuguese value |
|-----|---------------|-----------------|
| `photo_upload_modal.title` | `Upload Photo` | `Enviar Foto` |
| `photo_upload_modal.submit` | `Upload` | `Enviar` |
| `photo_upload_modal.cancel` | `Cancel` | `Cancelar` |
| `photo_upload_modal.error` | `Failed to upload photo. Please try again.` | `Falha ao enviar foto. Por favor, tente novamente.` |

Addition to existing namespace `game_edit_page`:

| Key | English value | Portuguese value |
|-----|---------------|-----------------|
| `game_edit_page.upload_photo_button` | `Upload Photo` | `Enviar Foto` |

## Implementation Steps

### Step 1 — Add keys to `en.yaml`

Add the `photo_upload_modal` block after the existing `login_modal` block. Add `upload_photo_button` key inside the existing `game_edit_page` block.

### Step 2 — Add keys to `pt.yaml`

Mirror the same structure in `frontend/assets/i18n/pt.yaml` with the Portuguese values above.

### Step 3 — Verify key parity

Run the i18n check to confirm all keys are present in both files:

```bash
docker-compose run --rm majora_fe npm run check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `photo_upload_modal` block + `game_edit_page.upload_photo_button`
- `frontend/assets/i18n/pt.yaml` — add matching keys with Portuguese translations

## Notes

- Keep keys in alphabetical order within each namespace (matching existing file conventions).
- Do not remove or rename any existing keys.
