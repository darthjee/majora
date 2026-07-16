# Translator Plan: Improve Treasure Exchange Modal (Search, Sorting, Money Display, Button Rename)

Main plan: [plan.md](plan.md)

## Shared contracts

Supplies the button label and the two new modal strings the frontend agent's Steps 6-7 render
(search input label/placeholder and the money-display label) — no data flows the other way.

## Implementation Steps

### Step 1 — Rename the button label
`frontend/assets/i18n/en.yaml:244` and `frontend/assets/i18n/pt.yaml:244`
(`character_treasures_page.add_treasure`): change the value only (key stays the same, so no
frontend code change is needed):
- `en.yaml`: `Add Treasure` → `Exchange Treasure`
- `pt.yaml`: `Adicionar Tesouro` → `Trocar Tesouros`

### Step 2 — Add two new `treasure_exchange_modal` keys
`frontend/assets/i18n/en.yaml:245-260` and `frontend/assets/i18n/pt.yaml:245-260` already have a
`treasure_exchange_modal` block. Add, in both files, keeping key order/style consistent with the
existing block (e.g. near the top, after `title`):
- `search_placeholder`: placeholder text for the new search input — e.g. `Search treasures...` /
  `Buscar tesouros...`.
- `your_money`: label prefixing the money display at the top of the modal — e.g. `Your money:` /
  `Seu dinheiro:`.

### Step 3 — Verify sync
Run the repo's i18n sync check to confirm `en.yaml`/`pt.yaml` stay key-for-key aligned.

## Files to Change
- `frontend/assets/i18n/en.yaml` — button value change + 2 new `treasure_exchange_modal` keys.
- `frontend/assets/i18n/pt.yaml` — matching Portuguese changes.

## CI Checks
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`).

## Notes
- Coordinate exact key names (`search_placeholder`, `your_money`) with the frontend agent if it
  ends up needing different/additional copy.
