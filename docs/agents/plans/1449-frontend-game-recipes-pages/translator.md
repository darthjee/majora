# Translator Plan: Frontend: game Recipes pages

Main plan: [plan.md](plan.md)

## Shared contracts

Add every key listed in [plan.md](plan.md#i18n-keys-frontend--translator), in both
`frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/`, plus any extra key the frontend agent
reports.

## Implementation Steps

### Step 1 — Add recipe translations
- Add `recipes` to the existing `game_page.yaml` (en: "Recipes", pt: "Receitas").
- Create `game_recipes_page.yaml`, `recipe_page.yaml`, `recipe_new_page.yaml`,
  `recipe_edit_page.yaml` and `common_item_recipes_preview.yaml` in both languages, following the
  shape of the matching common-item files (`game_common_items_page.yaml`, `common_item_page.yaml`,
  `common_item_new_page.yaml`, `common_item_edit_page.yaml`). `yield_format` keeps the
  `{{output}}` / `{{yield}}` interpolation placeholders verbatim.
- Each namespace is its own file, lazily loaded by `index.js`'s `chunkLoaders` proxy — no
  `index.js` change is needed (nothing goes into `common.yaml` / `commonNamespaces` here).
- Do not add the #1450 keys (`recipe_characters_preview`, `recipe_page.known_by_title`,
  `character_recipes_*`, `recipe_exchange_modal`).

## Files to Change
- `frontend/assets/i18n/{en,pt}/game_page.yaml` — `recipes`.
- `frontend/assets/i18n/{en,pt}/game_recipes_page.yaml` — new.
- `frontend/assets/i18n/{en,pt}/recipe_page.yaml` — new.
- `frontend/assets/i18n/{en,pt}/recipe_new_page.yaml` / `recipe_edit_page.yaml` — new.
- `frontend/assets/i18n/{en,pt}/common_item_recipes_preview.yaml` — new.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI step `npm run check_i18n`).
