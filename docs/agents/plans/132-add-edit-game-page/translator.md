# Translator Plan: Add Edit Game Page

Main plan: [plan.md](plan.md)

## Shared contracts

Add the `game_edit_page` namespace to both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`. The keys and their English values are:

```yaml
game_edit_page:
  title: Edit game
  name_label: Name
  photo_label: Photo URL
  description_label: Description
  submit: Save changes
  error: Failed to save game. Please try again.
```

Both files must have exactly the same set of keys under `game_edit_page` (the CI `check_i18n` job enforces key parity).

## Implementation Steps

### Step 1 — Add English keys

In `frontend/assets/i18n/en.yaml`, append the `game_edit_page:` block (after `npc_edit_page:` and before `language_selector:`, to keep related sections together).

### Step 2 — Add Portuguese keys

In `frontend/assets/i18n/pt.yaml`, append the same `game_edit_page:` block with Portuguese translations:

```yaml
game_edit_page:
  title: Editar jogo
  name_label: Nome
  photo_label: URL da foto
  description_label: Descrição
  submit: Salvar alterações
  error: Falha ao salvar o jogo. Por favor, tente novamente.
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `game_edit_page` block
- `frontend/assets/i18n/pt.yaml` — add `game_edit_page` block

## CI Checks

- `frontend/`: `docker-compose run frontend npm run check_i18n` (CI job: `frontend-i18n`)

## Notes

- Run `docker-compose run frontend npm run check_i18n` locally to verify key parity before committing.
