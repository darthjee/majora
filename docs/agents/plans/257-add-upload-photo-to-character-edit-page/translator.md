# Translator Plan: Add upload photo to character edit page

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent will add an "Upload Photo" button to the PC and NPC character edit
pages, referencing two new translation keys via `Translator.t()`:

- `pc_edit_page.upload_photo_button`
- `npc_edit_page.upload_photo_button`

These must be added under the existing `pc_edit_page:` and `npc_edit_page:` top-level keys
in every locale file, matching the existing `game_edit_page.upload_photo_button` pattern.

## Implementation Steps

### Step 1 — Add the new keys to `en.yaml`

In `frontend/assets/i18n/en.yaml`, add `upload_photo_button: Upload Photo` as the last line
of both the `pc_edit_page:` block and the `npc_edit_page:` block (same English copy already
used for `game_edit_page.upload_photo_button`).

### Step 2 — Add the new keys to `pt.yaml`

In `frontend/assets/i18n/pt.yaml`, add `upload_photo_button: Enviar Foto` as the last line
of both the `pc_edit_page:` block and the `npc_edit_page:` block (same Portuguese copy
already used for `game_edit_page.upload_photo_button`).

### Step 3 — Verify key parity

Run the key-parity check locally to confirm no locale is missing a key:

```bash
docker-compose run majora_fe npm run check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `upload_photo_button` under `pc_edit_page` and `npc_edit_page`
- `frontend/assets/i18n/pt.yaml` — add `upload_photo_button` under `pc_edit_page` and `npc_edit_page`

## CI Checks

- `frontend`: `docker-compose run majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- If any other locale file is added to `frontend/assets/i18n/` before this lands, it needs
  the same two keys too — the key-parity check will catch any omission.
