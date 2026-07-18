# Translator Plan: Add players page

Main plan: [plan.md](plan.md)

## Shared contracts

Must add the two keys the frontend agent's Steps 1 and 3 read via `Translator.t(...)` (see
[frontend.md](frontend.md)):

- `game_page.players` — nav dropdown link label ("Players"), placed in the existing
  `game_page:` namespace alongside `player_characters`/`non_player_characters`/`treasures`/
  `items`/`sessions`.
- `game_players_page.loading` — loading message for the players list page, a new namespace
  mirroring the existing `game_characters_page: { loading: ... }` shape.

## Implementation Steps

### Step 1 — Add the keys to every locale file

In `frontend/assets/i18n/en.yaml`, add to the existing `game_page:` block:

```yaml
game_page:
  # ...existing keys...
  players: Players
```

Add a new top-level block (English content shown; adjust per language for the other
files):

```yaml
game_players_page:
  loading: Loading players...
```

Repeat identically (same key structure, translated values) in
`frontend/assets/i18n/pt.yaml`, and any other locale file present under
`frontend/assets/i18n/`.

### Step 2 — Verify parity

Run:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

Fix any reported missing/extra key mismatch before considering this done.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `game_page.players`, new `game_players_page.loading`.
- `frontend/assets/i18n/pt.yaml` — same two keys, Portuguese values.
- Any additional locale file already present under `frontend/assets/i18n/`.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job:
  `frontend-checks`)

## Notes

- No new language or i18n wiring is introduced — this is content-only, so
  `Translator.js`/`LanguageSelectorController.js` are untouched.
