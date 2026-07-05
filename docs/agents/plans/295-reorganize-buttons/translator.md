# Translator Plan: Reorganize buttons

Main plan: [plan.md](plan.md)

## Shared contracts

- No new keys are introduced or removed — `frontend` reuses the two existing keys
  below as-is for the new header nav links. This task only edits their **values**,
  so `npm run check_i18n` key-parity between `en.yaml`/`pt.yaml` is unaffected.

## Implementation Steps

### Step 1 — Shorten the "see all photos" labels

In `frontend/assets/i18n/en.yaml`:
- `game_page.see_all_photos`: change value from `See all photos` to `Photos`.
- `character_page.see_all_photos`: change value from `See all photos` to `Photos`.

In `frontend/assets/i18n/pt.yaml`:
- `game_page.see_all_photos`: change value from `Ver todas as fotos` to `Fotos`.
- `character_page.see_all_photos`: change value from `Ver todas as fotos` to `Fotos`.

Do not rename or remove the keys themselves, and do not touch `game_page.treasures`
or `game_page.sessions` — their values are unchanged.

## Files to Change

- `frontend/assets/i18n/en.yaml` — shorten `game_page.see_all_photos` and
  `character_page.see_all_photos` values to `Photos`.
- `frontend/assets/i18n/pt.yaml` — shorten `game_page.see_all_photos` and
  `character_page.see_all_photos` values to `Fotos`.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- This is a pure value rename; no key-parity script changes are needed since key
  names/structure stay identical between `en.yaml` and `pt.yaml`.
