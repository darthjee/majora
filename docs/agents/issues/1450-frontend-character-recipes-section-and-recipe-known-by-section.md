# Issue: Frontend: character recipes section and recipe 'Known by' section

## Description
Part of #1441 (crafting recipes). Build the character-level recipe UI described in
`docs/agents/specs/recipes/frontend.md`, against the already-merged CharacterRecipe API (#1447,
#1459) and on top of the game recipe pages merged in #1449 (which reuses `CardRecipeImage`,
`RecipePreviewCard` and `recipeConfig.js`). It also takes over the recipe show page's
"Known by" shortlist, which #1449 explicitly left to this issue.

## Problem
Characters can know recipes in the API, but there is no UI to see which recipes a PC/NPC knows,
to teach or forget a recipe, to hide a known recipe, or to see from a recipe which characters
know it.

## Expected Behavior
- **PC/NPC dropdown:** a "Recipes" entry (`character_page.recipes_title`) after Documents.
- **PC/NPC show page:** a "Recipes" shortlist (5 entries, thumbnail + name, masked output shows
  the placeholder) with a "See all" link; empty state `character_recipes_preview.empty`.
- **Full list** (`#/games/:game_slug/pcs|npcs/:character_id/recipes`): recipe cards, hidden badge
  on `/all.json` rows, and an "Exchange" button gated by `can_exchange_recipe`.
- **Exchange modal:** *Acquire* tab browsing `available` recipes (`?name=` search, GM variant
  `available/all` / `acquire/all` for hidden recipes), body `{game_recipe_id}` only, no hidden
  switch; *Remove* tab browsing the character's own recipes. `422` → already known, `404` → not
  found, `400` → invalid.
- **Detail** (`#/games/:game_slug/pcs|npcs/:character_id/recipes/:id`): read-only recipe fields
  (as on the game recipe show page), link to the game recipe, and a hidden toggle for callers
  served `/full.json` (PATCH `{hidden}` only); `404` → standard not-found state.
- **Recipe show page "Known by" shortlist:** first mixed PC/NPC shortlist (href by entry
  `type`), no "See all"; empty state `recipe_characters_preview.empty`.
- All texts translated in every language.

## Solution
Follow `docs/agents/specs/recipes/frontend.md` (*Character recipes*, *Shortlists*, *Request
wiring → characterRecipeConfig.js*, *i18n* rows tagged #1450), plus the "Known by" rows tagged
#1449:
- Routes in `HashRouteResolver.js` / `AppHelper.jsx` (above `/pcs|npcs/:character_id`); nav
  entry in `characterItems(kind)` of `HeaderNavHelper.jsx`.
- `PcCharacterRecipes` / `NpcCharacterRecipes` → shared `CharacterRecipes.jsx` (modeled on
  `CharacterDocuments.jsx`); `recipeListTypes.js` (`pc-recipes` / `npc-recipes`).
- Detail page reusing the #1449 recipe display fields; hidden switch like `ItemHiddenField.jsx`.
- Exchange modal: `recipeExchangeTabs.js`, `AcquireRecipeTab.jsx` / `RemoveRecipeTab.jsx` on
  `ExchangeDetailPane.jsx`; `can_exchange_recipe` in `AccessStorePermissions.js` merged through
  `CharacterAccessResolver.js`.
- `utils/requests/config/characterRecipeConfig.js` + resolvers in
  `RequestPermissionResolvers.js` (`collection`/`single` character-level,
  `availableCollection` game-level); add the `characters` quantity type to `recipeConfig.js`
  (game-level resolver).
- Shortlists: `buildShortListSlot('recipe')` in `pcShowType.js` / `npcShowType.js`,
  `buildShortListSlot('recipeCharacter')` in `recipeShowType.js`, with their
  `shortListResourceConfig.js` / `PREVIEW_LIST_TYPES` entries.
- i18n (translator agent): `character_page.recipes_title`, `character_recipes_page`,
  `character_recipe_page`, `character_recipes_preview`, `recipe_exchange_modal` (added to
  `commonNamespaces`), `recipe_characters_preview`, `recipe_page.known_by_title`.
- Jasmine specs (frontend agent). No backend or Navi changes expected.

### Out of scope
- Game recipe list/show/new/edit pages and the "Recipes that produce it" shortlist (#1449, merged).
- A full "Known by" page.

## Benefits
Players and GMs can see and manage which recipes each character knows, and see from any recipe
who knows it — completing the crafting recipes feature (#1441).
