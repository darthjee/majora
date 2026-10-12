# Translator Plan: Game content copy: Common items tab

Main plan: [plan.md](plan.md)

## Shared contracts

Add to `staff_copies_page` in both languages:
- `category_column`: en "Category", pt "Categoria"
- `price_column`: en "Price", pt "Preço"

Category value labels reuse the existing `common_item_page.category.<value>` keys. Do not add
new ones.

## Implementation Steps

### Step 1 — Add the column header keys
Add the two keys next to `photo_column`/`hidden_column` in en and pt, and run the translation
key sync check.

## Files to Change
- `frontend/assets/i18n/en/staff_copies_page.yaml` — `category_column`, `price_column`.
- `frontend/assets/i18n/pt/staff_copies_page.yaml` — same keys, Portuguese.

## CI Checks
- `frontend/`: `npm run coverage` and `npm run lint`, through docker-compose/make (CI jobs:
  `jasmine`, `frontend-checks`)
