# Translator Plan: Game content copy: Recipes tab

Main plan: [plan.md](plan.md)

## Shared contracts

Provides the `staff_copies_page` keys consumed by the frontend:
`common_item_column`, `common_item_reused`, `common_item_will_copy`.

## Implementation Steps

### Step 1 — Add the keys
Add to `staff_copies_page` in both languages:

| Key | en | pt |
|---|---|---|
| `common_item_column` | Common item | Item comum |
| `common_item_reused` | Reused | Reaproveitado |
| `common_item_will_copy` | Will be copied | Será copiado |

Keep pt wording consistent with the existing `common_items` translations in the pt file, and run
the translation key sync check.

## Files to Change
- `frontend/assets/i18n/en/staff_copies_page.yaml` — new keys.
- `frontend/assets/i18n/pt/staff_copies_page.yaml` — new keys.
