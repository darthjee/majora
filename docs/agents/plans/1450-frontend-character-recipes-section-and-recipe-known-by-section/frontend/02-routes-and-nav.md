# Routes and PC/NPC nav entry

Register the four character recipe routes and the "Recipes" entry in the PC/NPC dropdowns.

- **`utils/routing/HashRouteResolver.js`** (`ROUTES`): add, next to the `documents` routes and
  above the generic `/pcs|npcs/:character_id` route:
  - `['/games/:game_slug/npcs/:character_id/recipes/:id', 'npcCharacterRecipe']`
  - `['/games/:game_slug/npcs/:character_id/recipes', 'npcCharacterRecipes']`
  - `['/games/:game_slug/pcs/:character_id/recipes/:id', 'pcCharacterRecipe']`
  - `['/games/:game_slug/pcs/:character_id/recipes', 'pcCharacterRecipes']`
- **`components/helpers/AppHelper.jsx`** (`PAGES`): map those keys to `<PcCharacterRecipe />`,
  `<PcCharacterRecipes />`, `<NpcCharacterRecipe />` and `<NpcCharacterRecipes />` (created in
  steps 03/04).
- **`components/common/header/helpers/HeaderNavHelper.jsx`**: in `characterItems(kind)` add
  `characterItem(kind, 'recipes', '/recipes', 'character_page.recipes_title')` right after
  documents, and update the "five PC/NPC dropdown entries" JSDoc.
- No `accessRouteConfig.js` entry, same as Documents.

## Files to Change
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — four routes.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — four page mappings.
- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — dropdown entry.
- Matching specs (route resolution order, nav entries for pc and npc).
