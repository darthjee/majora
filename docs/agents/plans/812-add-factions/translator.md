# Translator Plan: Add factions

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the exact key names listed in [plan.md](plan.md)'s "Shared contracts" section — the
frontend agent's components call `Translator.t(...)` with these keys verbatim, so key names and
file names must match exactly what's listed there. Naming mirrors `source_new_page.yaml`/
`source_page.yaml`/`sources_page.yaml` (modal-based creation), not `possession_new_page.yaml`
(dedicated `/new` page).

## Implementation Steps

### Step 1 — New page translation files

Create these 4 files in **both** `frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/`:

- `game_factions_page.yaml` (mirrors `sources_page.yaml`, plus a `title` key since this is a
  per-game page like `game_possessions_page.yaml`, not a global one like `sources_page.yaml`):
  ```yaml
  # en
  game_factions_page:
    title: Factions
    loading: Loading factions...
    new_faction: New Faction
  ```
  ```yaml
  # pt
  game_factions_page:
    title: Facções
    loading: Carregando facções...
    new_faction: Nova Facção
  ```
- `faction_new_page.yaml` (mirrors `source_new_page.yaml`, minus `url_label` — Faction has no
  url field):
  ```yaml
  # en
  faction_new_page:
    title: New Faction
    name_label: Name
    submit: Create Faction
    error: Failed to create faction. Please try again.
    photo_upload_failed: Failed to upload the photo. The faction was created — you can retry the upload or skip it for now.
    retry_photo_upload: Retry photo upload
    skip_photo_upload: Skip and continue
  ```
  ```yaml
  # pt
  faction_new_page:
    title: Nova Facção
    name_label: Nome
    submit: Criar Facção
    error: Falha ao criar a facção. Tente novamente.
    photo_upload_failed: Falha ao enviar a foto. A facção foi criada — você pode tentar novamente ou pular por enquanto.
    retry_photo_upload: Tentar enviar a foto novamente
    skip_photo_upload: Pular e continuar
  ```
- `faction_edit_page.yaml` (mirrors `possession_edit_page.yaml`, minus `description_label`/
  `hidden_label`):
  ```yaml
  # en
  faction_edit_page:
    title: Edit faction
    name_label: Name
    submit: Save changes
    error: Failed to save faction. Please try again.
  ```
  ```yaml
  # pt
  faction_edit_page:
    title: Editar facção
    name_label: Nome
    submit: Salvar alterações
    error: Falha ao salvar a facção. Tente novamente.
  ```
- `faction_page.yaml` (mirrors `source_page.yaml`, minus `url` — Faction has no url field):
  ```yaml
  # en
  faction_page:
    loading: Loading faction...
  ```
  ```yaml
  # pt
  faction_page:
    loading: Carregando facção...
  ```

### Step 2 — Extend the existing game nav file

Add a `factions` key to the **existing** `game_page.yaml` in both languages, alongside its
current `treasures`/`items`/`documents` keys (same file, not a new one):

- `en`: `factions: Factions`
- `pt`: `factions: Facções`

### Step 3 — Verify

Run the sync-check script (`frontend`: `npm run check_i18n`) to confirm every new key exists in
both languages with no drift, once the frontend agent's components reference them.

## Files to Change

- `frontend/assets/i18n/en/game_factions_page.yaml` — new
- `frontend/assets/i18n/en/faction_new_page.yaml` — new
- `frontend/assets/i18n/en/faction_edit_page.yaml` — new
- `frontend/assets/i18n/en/faction_page.yaml` — new
- `frontend/assets/i18n/pt/game_factions_page.yaml` — new
- `frontend/assets/i18n/pt/faction_new_page.yaml` — new
- `frontend/assets/i18n/pt/faction_edit_page.yaml` — new
- `frontend/assets/i18n/pt/faction_page.yaml` — new
- `frontend/assets/i18n/en/game_page.yaml` — add `factions` key
- `frontend/assets/i18n/pt/game_page.yaml` — add `factions` key

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Land these together with (or before) the frontend agent's components — `check_i18n` only
  verifies en/pt key parity with each other, not that every key is actually referenced, so this
  step alone won't fail CI if frontend hasn't landed yet, but the reverse (frontend referencing
  keys that don't exist here) will surface as missing-translation warnings at runtime.
