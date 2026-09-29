# Issue: Frontend: game Recipes pages

## Description
Part of #1441 (crafting recipes). Build the game-level recipe UI described in
`docs/agents/specs/recipes/frontend.md`, against the already-merged GameRecipe read/write API
(#1445, #1446) and the recipe "characters" / common-item "recipes" endpoints (#1447, #1459).

## Problem
Game recipes exist in the API but have no UI yet: nobody can browse, read, create or edit a
recipe, and a common item's page doesn't show which recipes produce it.

## Expected Behavior
- A "Recipes" entry in the header "Game" dropdown, right after Common Items (`IS_GAME_PAGE`).
- **List** (`#/games/:game_slug/recipes`): cards with thumbnail (output item photo, or the
  common-item placeholder when the output is masked/has no photo), name, and
  "<output name> × <yield>" ("unknown" when masked); category filter via `?category=`;
  "New" button gated by `can_create_recipe`; hidden badge on `/all.json` items.
- **Show** (`#/games/:game_slug/recipes/:id`): name, thumbnail, output (link or "unknown"),
  yield, crafting time, `crafting_cost` via `TreasureMoney`, markdown `description` /
  `ingredients` / `checks`, hidden badge for editors, edit link gated by `can_edit` from
  `/permissions/game_recipe.json`; 404 → standard not-found state.
- **New / Edit**: name, output selector (game's common items), yield (min 1, default 1),
  crafting time, `crafting_cost` via `TreasureMoney` + `MoneyEditModal context="treasure"`,
  markdown fields via `MarkdownEditor`, hidden switch. `400` on the output shows
  `errors.invalid_output`; saving with `hidden: true` as a regular-tier caller redirects to the
  list with a `hidden_notice`.
- **"Recipes that produce it"** shortlist on the common item show page.
- All texts translated in every language.

## Solution
Follow `docs/agents/specs/recipes/frontend.md` (sections *Placement and navigation*, *Game recipe
pages*, *Shortlists*, *Request wiring → recipeConfig.js*, *i18n* rows tagged #1449):
- Routes in `HashRouteResolver.js` / `AppHelper.jsx`; nav entry in `HeaderNavHelper.jsx`.
- `GameRecipes` / `GameRecipe` / `GameRecipeNew` / `GameRecipeEdit` pages modeled on the
  Common Item pages; `recipeListType.js`, `recipeShowType.js`, `CardRecipeImage.jsx`
  (registered as `recipe` in `PHOTO_COMPONENTS`), `RecipeFilters` (Tasks-filter pattern).
- `utils/requests/config/recipeConfig.js` + game-level `recipe.*` resolvers in
  `RequestPermissionResolvers.js`; `can_create_recipe` in `AccessStorePermissions.js`.
- Output selector: `SingleResourcePickerField` in API mode over `commonItem`
  (`maxEntries: 5`, `params: {gameSlug}`); a masked current output shows as "unknown" on edit and
  is not re-sent unless changed.
- **Backend (backend agent):** add an optional `?name=` case-insensitive substring filter to
  `GET /games/:slug/common_items.json` and `/common_items/all.json` (view
  `games/views/games/game_common_items.py` and its `_all` sibling), so the picker can search.
  Needs data-access and security review; Navi cache config checked by the cache agent.
- Shortlist on `commonItemShowType.js` (`buildShortListSlot('commonItemRecipe')`).
- `recipeConfig.js` covers `collection`, `single`, `commonItemCollection`, POST `collection`
  and PATCH `single`; the `characters` quantity type is left to #1450.
- i18n (translator agent) and Jasmine specs (frontend agent); backend tests for the `?name=`
  filter.

### Out of scope
- Character recipe pages, PC/NPC shortlist and exchange modal (#1450).
- The "Known by" shortlist on the recipe show page, its `recipe.characters` request wiring and
  its i18n (`recipe_characters_preview`, `recipe_page.known_by_title`). #1450 owns them, even
  though `frontend.md` assigns them to #1449.

## Benefits
GMs and players can manage and consult a game's crafting recipes, and see from any common item
which recipes produce it.
