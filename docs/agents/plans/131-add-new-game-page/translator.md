# Translator Plan: Add New Game Page

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent uses these translation keys. Both `en.yaml` and `pt.yaml` must define every key listed.

**game_new_page namespace** (used by `GameNewHelper`):
- `game_new_page.title` — page heading
- `game_new_page.name_label` — label for the name input
- `game_new_page.photo_label` — label for the photo URL input
- `game_new_page.description_label` — label for the description input
- `game_new_page.submit` — submit button label
- `game_new_page.error` — generic error message shown when creation fails

**games_page namespace** (used by `GamesHelper`):
- `games_page.new_game` — label for the "New Game" link/button on the games list

## Implementation Steps

### Step 1 — Add English translations

In `frontend/assets/i18n/en.yaml`, add under `games_page:`:
```yaml
  new_game: New Game
```

Add a new top-level `game_new_page:` section:
```yaml
game_new_page:
  title: New Game
  name_label: Name
  photo_label: Photo URL
  description_label: Description
  submit: Create Game
  error: Failed to create game. Please try again.
```

### Step 2 — Add Portuguese translations

In `frontend/assets/i18n/pt.yaml`, add under `games_page:`:
```yaml
  new_game: Novo Jogo
```

Add a new top-level `game_new_page:` section:
```yaml
game_new_page:
  title: Novo Jogo
  name_label: Nome
  photo_label: URL da Foto
  description_label: Descrição
  submit: Criar Jogo
  error: Falha ao criar jogo. Por favor, tente novamente.
```

### Step 3 — Verify key parity

Run the key-parity check script (if present) to confirm both YAML files have identical keys:
```bash
docker-compose run --rm majora_fe npm run lint
```
(The lint job in CI validates translation key parity via `frontend-checks`.)

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `games_page.new_game` and `game_new_page` section
- `frontend/assets/i18n/pt.yaml` — add `games_page.new_game` and `game_new_page` section

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- Keep keys in the same alphabetical/logical order used by the existing YAML files.
- Do not add `upload_photo_button` to `game_new_page` — per the frontend plan, the photo upload button is omitted from the new-game form (the game does not yet have a slug, so upload cannot work at creation time).
