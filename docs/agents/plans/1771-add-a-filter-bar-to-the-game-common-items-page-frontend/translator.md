# Translator Plan: Add a filter bar to the game common items page (frontend)

Main plan: [plan.md](plan.md)

## Shared contracts

Add these keys under `game_common_items_page` in every language (`en`, `pt`):

| Key | en | pt |
|-----|----|----|
| `filter_name_label` | Name | Nome |
| `filter_name_placeholder` | Search by name... | Buscar por nome... |
| `filter_category_label` | Category | Categoria |
| `filter_category_all` | All | Todas |
| `filter_min_price_label` | Min price | Preço mínimo |
| `filter_max_price_label` | Max price | Preço máximo |

Category option labels reuse the existing `common_item_page.category.*` keys: do not add new
ones.

## Implementation Steps

### Step 1 — Add the filter keys

Add the six keys above to `frontend/assets/i18n/en/game_common_items_page.yaml` and
`frontend/assets/i18n/pt/game_common_items_page.yaml`. Match the wording of the existing
`treasures_page.filter_*` / `game_recipes_page.category_filter_*` keys in each language for
consistency (check the `pt` files for the established terms before choosing).

## Files to Change

- `frontend/assets/i18n/en/game_common_items_page.yaml`: new filter keys.
- `frontend/assets/i18n/pt/game_common_items_page.yaml`: new filter keys.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI step: Check translations)
