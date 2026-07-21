# Translator Plan: Add photo on NPC creation

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent will call `Translator.t('<key>')` for every new
user-visible string introduced by this issue and will not hardcode English or
Portuguese text. Add the corresponding keys to every existing locale file
under `frontend/assets/i18n/` (currently `en.yaml` and `pt.yaml`; keep both in
sync, per the key-parity check run by `npm run check_i18n`).

## Implementation Steps

### Step 1 — New key in the existing `photo_upload_modal` namespace

`PhotoUploadModal`'s submit button needs a "Confirm" label for its new
deferred mode (used on the NPC creation page), distinct from the existing
"Upload" label used on the edit page's immediate-upload mode.

`en.yaml` (near the existing `photo_upload_modal.submit` key):
```yaml
photo_upload_modal:
  confirm: Confirm
```

`pt.yaml`:
```yaml
photo_upload_modal:
  confirm: Confirmar
```

### Step 2 — New keys in the existing `game_npc_new_page` namespace

Cover the retry/skip state shown when the NPC was created successfully but the
deferred photo upload that follows it fails.

`en.yaml` (near the existing `game_npc_new_page.error` key):
```yaml
game_npc_new_page:
  photo_upload_failed: Failed to upload the photo. The NPC was created — you can retry the upload or skip it for now.
  retry_photo_upload: Retry photo upload
  skip_photo_upload: Skip and continue
```

`pt.yaml`:
```yaml
game_npc_new_page:
  photo_upload_failed: Falha ao enviar a foto. O NPC foi criado — você pode tentar novamente ou pular por enquanto.
  retry_photo_upload: Tentar enviar a foto novamente
  skip_photo_upload: Pular e continuar
```

Coordinate with the `frontend` agent on the exact key names it ends up
referencing in `GameNpcNewHelper.jsx`/`PhotoUploadModalHelper.jsx` — this
file's names are a starting proposal; keep it in lockstep with the actual
`Translator.t()` calls if they diverge during implementation.

### Step 3 — Verify key parity

Run the key-parity check across every locale file after adding the keys.

## Files to Change

- `frontend/assets/i18n/en.yaml`
- `frontend/assets/i18n/pt.yaml`

## CI Checks

- `frontend/`: `npm run check_i18n` (CI job: `frontend-checks` in `.circleci/config.yml`)
