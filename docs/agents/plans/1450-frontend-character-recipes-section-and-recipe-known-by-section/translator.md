# Translator Plan: Frontend: character recipes section and recipe 'Known by' section

Main plan: [plan.md](plan.md)

## Shared contracts

Produce exactly the keys listed under "i18n keys" in [plan.md](plan.md#i18n-keys-produced-by-translator-consumed-by-frontend),
in `frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/`, keys in parity. The frontend agent
references them by these exact names.

## Implementation Steps

### Step 1 — Add the character recipe namespaces and keys
- New files (en + pt): `character_recipes_page.yaml`, `character_recipe_page.yaml`,
  `character_recipes_preview.yaml`, `recipe_characters_preview.yaml`.
- `common.yaml` (en + pt): add `character_page.recipes_title` next to
  `character_page.documents_title`, and a new top-level `recipe_exchange_modal` block modeled on
  `document_exchange_modal`.
- `recipe_page.yaml` (en + pt): add `known_by_title`.
- Suggested English: "Recipes", "Known by", "Exchange", "Hidden", "No recipes known yet.",
  "Nobody knows this recipe yet.", "Acquire" / "Learn a recipe", "Remove" / "Forget a recipe",
  "This character already knows this recipe.", "Recipe not found.", "Invalid recipe.",
  "View game recipe", "Hidden from players". Portuguese uses the same terms as the existing
  `recipe_page` / `game_recipes_page` translations ("Receitas", etc.).

### Step 2 — Register the common namespace and verify parity
- Add `'recipe_exchange_modal'` to `commonNamespaces` in `frontend/assets/i18n/en/index.js` and
  `frontend/assets/i18n/pt/index.js`.
- Run the key-parity check script described in `docs/agents/i18n.md`.

## Files to Change
- `frontend/assets/i18n/{en,pt}/character_recipes_page.yaml` — new.
- `frontend/assets/i18n/{en,pt}/character_recipe_page.yaml` — new.
- `frontend/assets/i18n/{en,pt}/character_recipes_preview.yaml` — new.
- `frontend/assets/i18n/{en,pt}/recipe_characters_preview.yaml` — new.
- `frontend/assets/i18n/{en,pt}/common.yaml` — `character_page.recipes_title`,
  `recipe_exchange_modal.*`.
- `frontend/assets/i18n/{en,pt}/recipe_page.yaml` — `known_by_title`.
- `frontend/assets/i18n/{en,pt}/index.js` — `commonNamespaces`.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`) and the
  i18n parity script from `docs/agents/i18n.md`.

## Notes
- If the frontend agent needs an extra key while implementing (e.g. a loading/empty text in the
  exchange tabs), it gets added here in both languages. No hard-coded strings in components.
