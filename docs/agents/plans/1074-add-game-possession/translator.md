# Translator Plan: Add Game Possession

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the exact key names listed in [plan.md](plan.md)'s "Shared contracts" section — the
frontend agent's components call `Translator.t(...)` with these keys verbatim, so key names
and file names must match exactly what's listed there.

## Implementation Steps

### Step 1 — New page translation files

Create these 4 files in **both** `frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/`,
mirroring the equivalent `item_*`/`game_items_page` files' structure and tone exactly (see
`frontend/assets/i18n/en/game_items_page.yaml`, `item_new_page.yaml`, `item_edit_page.yaml`,
`item_page.yaml` as templates):

- `game_possessions_page.yaml`:
  ```yaml
  game_possessions_page:
    loading: Loading possessions...
    title: Possessions
    hidden_label: Hidden
    create_possession: Create Possession
  ```
- `possession_new_page.yaml` (mirrors `item_new_page.yaml`):
  ```yaml
  possession_new_page:
    title: Create Possession
    name_label: Name
    description_label: Description
    hidden_label: Hidden
    submit: Create Possession
    error: Failed to create possession. Please try again.
    photo_upload_failed: Failed to upload the photo. The possession was created — you can retry the upload or skip it for now.
    retry_photo_upload: Retry photo upload
    skip_photo_upload: Skip and continue
  ```
- `possession_edit_page.yaml` (mirrors `item_edit_page.yaml`):
  ```yaml
  possession_edit_page:
    title: Edit possession
    name_label: Name
    description_label: Description
    hidden_label: Hidden
    submit: Save changes
    error: Failed to save possession. Please try again.
  ```
- `possession_page.yaml` (mirrors `item_page.yaml`):
  ```yaml
  possession_page:
    loading: Loading possession...
    hidden_label: Hidden
  ```

Produce accurate `pt` translations for each (not machine-literal copies) — match the existing
tone/phrasing already used in `frontend/assets/i18n/pt/item_*.yaml`/`game_items_page.yaml`.

### Step 2 — Extend the existing game nav file

Add a `possessions` key to the **existing** `game_page.yaml` in both languages, alongside its
current `treasures`/`items`/`documents` keys (same file, not a new one):

- `en`: `possessions: Possessions`
- `pt`: mirror the existing `items: Itens` entry's phrasing pattern

### Step 3 — Verify

Run the sync-check script (`frontend`: `npm run check_i18n`) to confirm every new key exists in
both languages with no drift, once the frontend agent's components reference them.

## Files to Change

- `frontend/assets/i18n/en/game_possessions_page.yaml` — new
- `frontend/assets/i18n/en/possession_new_page.yaml` — new
- `frontend/assets/i18n/en/possession_edit_page.yaml` — new
- `frontend/assets/i18n/en/possession_page.yaml` — new
- `frontend/assets/i18n/pt/game_possessions_page.yaml` — new
- `frontend/assets/i18n/pt/possession_new_page.yaml` — new
- `frontend/assets/i18n/pt/possession_edit_page.yaml` — new
- `frontend/assets/i18n/pt/possession_page.yaml` — new
- `frontend/assets/i18n/en/game_page.yaml` — add `possessions` key
- `frontend/assets/i18n/pt/game_page.yaml` — add `possessions` key

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Land these together with (or before) the frontend agent's components — `check_i18n` only
  verifies en/pt key parity with each other, not that every key is actually referenced, so this
  step alone won't fail CI if frontend hasn't landed yet, but the reverse (frontend referencing
  keys that don't exist here) will surface as missing-translation warnings at runtime.
