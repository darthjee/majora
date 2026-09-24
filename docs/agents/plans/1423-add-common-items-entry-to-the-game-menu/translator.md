# Translator Plan: Add "Common Items" entry to the Game menu

Main plan: [plan.md](plan.md)

## Shared contracts

- Provide the i18n key `game_page.common_items` in every language directory:
  - en: `Common Items`
  - pt: `Itens Comuns`
- The frontend reads it via `Translator.t('game_page.common_items')` in the Game dropdown.

## Implementation Steps

### Step 1 — Add the `game_page.common_items` label

Add `common_items` under the `game_page:` root in both files, right after the existing
`items:` key to mirror the menu order:

- `frontend/assets/i18n/en/game_page.yaml`: `common_items: Common Items`
- `frontend/assets/i18n/pt/game_page.yaml`: `common_items: Itens Comuns`

## Files to Change

- `frontend/assets/i18n/en/game_page.yaml`: new `common_items` key.
- `frontend/assets/i18n/pt/game_page.yaml`: new `common_items` key.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- `pt/game_page.yaml` already translates the sibling keys, e.g. `possessions: Posses…`,
  so follow its existing style and quoting.
