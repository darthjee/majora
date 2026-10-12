# Translator Plan: Game content copy: Items tab

Main plan: [plan.md](plan.md)

## Shared contracts

Adds under `staff_copies_page` (every language, keys in sync):

| Key | en | pt |
|---|---|---|
| `photo_column` | Photo | Foto |
| `hidden_column` | Visibility | Visibilidade |
| `hidden_badge` | Hidden | Oculto |

The `types.items` tab label already exists (#1571) — do not touch it.

## Implementation Steps

### Step 1 — Add the column and badge keys
Add the three keys to `staff_copies_page.yaml` in each language folder, next to `name_column`,
matching the wording style of the existing keys (check `pt` for an existing "Oculto"/"Oculta"
convention in other pages and stay consistent), then run the translation key sync check.

## Files to Change
- `frontend/assets/i18n/en/staff_copies_page.yaml` — new keys.
- `frontend/assets/i18n/pt/staff_copies_page.yaml` — new keys.

## CI Checks
- `frontend`: the translation key sync script/spec (see `AGENTS.md`) — part of the frontend CI job.
