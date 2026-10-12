# Translator Plan: Game content copy: Documents tab

Main plan: [plan.md](plan.md)

## Shared contracts

Add, under `staff_copies_page` in both languages:

- `counts_column` — en `Contents`, pt `Conteúdo`.
- `document_counts` — en `'{{pages}} pages / {{photos}} photos / {{files}} files'`,
  pt `'{{pages}} páginas / {{photos}} fotos / {{files}} arquivos'`.

## Implementation Steps

### Step 1 — Add the Documents row keys
Add the two keys above to `staff_copies_page` in the en and pt files, next to the other column
keys (`common_item_column` etc.), and keep the key sets identical across languages.

## Files to Change
- `frontend/assets/i18n/en/staff_copies_page.yaml` — `counts_column`, `document_counts`.
- `frontend/assets/i18n/pt/staff_copies_page.yaml` — same keys, translated.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)
