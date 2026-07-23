# Translator Plan: Add photo upload on `CharacterItem` Creation page

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent's new `ItemNewPhotoUploadFailedAlert` component calls
`Translator.t('character_item_new_page.photo_upload_failed')`, `.retry_photo_upload`, and
`.skip_photo_upload`. These three keys must exist in every locale file before that component
can render correctly.

## Implementation Steps

### Step 1 — Add the three new keys to both locale files

`frontend/assets/i18n/en.yaml`, in the existing `character_item_new_page:` block (currently
ends at line 319 with `error: Failed to create item. Please try again.`), add — mirroring the
existing `game_npc_new_page` equivalents (lines 545-547):

```yaml
  photo_upload_failed: Failed to upload the photo. The item was created — you can retry the upload or skip it for now.
  retry_photo_upload: Retry photo upload
  skip_photo_upload: Skip and continue
```

`frontend/assets/i18n/pt.yaml`, same block, the Portuguese equivalents (mirroring lines
545-547 of that file):

```yaml
  photo_upload_failed: Falha ao enviar a foto. O item foi criado — você pode tentar novamente ou pular por enquanto.
  retry_photo_upload: Tentar enviar a foto novamente
  skip_photo_upload: Pular e continuar
```

### Step 2 — Verify sync

Run the i18n sync check locally to confirm both locale files stay in sync (same keys, same
order expectations if the checker enforces one).

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- Only `en.yaml` and `pt.yaml` exist today — no other locales to update.
