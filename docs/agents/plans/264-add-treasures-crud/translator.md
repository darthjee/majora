# Translator Plan: Add treasures CRUD

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent adds a superuser-only "Treasures" link to the header nav, referencing
one new translation key via `Translator.t()`:

- `header.nav_treasures`

This must be added under the existing top-level `header:` block in every locale file,
immediately next to the existing `header.nav_games` key.

## Implementation Steps

### Step 1 — Add the new key to `en.yaml`

In `frontend/assets/i18n/en.yaml`, add `nav_treasures: Treasures` under the `header:`
block, right after `nav_games: Games`.

### Step 2 — Add the new key to `pt.yaml`

In `frontend/assets/i18n/pt.yaml`, add `nav_treasures: Tesouros` under the `header:`
block, right after `nav_games: Campanhas` (matching the existing Portuguese copy already
used for `treasures_page`/`game_treasures_page`, e.g. `game_treasures_page.treasures:
Tesouros`).

### Step 3 — Verify key parity

```bash
docker-compose run majora_fe npm run check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `nav_treasures` under `header`
- `frontend/assets/i18n/pt.yaml` — add `nav_treasures` under `header`

## CI Checks

- `frontend`: `docker-compose run majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- No other locale files exist today; if one is added before this lands, it needs the same
  key too — the key-parity check will catch any omission.
