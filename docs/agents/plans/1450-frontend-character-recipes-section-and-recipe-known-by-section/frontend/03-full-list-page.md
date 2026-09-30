# Full list page

`#/games/:game_slug/pcs|npcs/:character_id/recipes`, modeled on `shared/CharacterDocuments.jsx`.

- **`components/resources/character/pages/PcCharacterRecipes.jsx` /
  `NpcCharacterRecipes.jsx`**: thin wrappers rendering `<CharacterRecipes characterKind="pcs"
  listType="pc-recipes" isPc />` (and the NPC equivalent).
- **`components/resources/character/pages/shared/CharacterRecipes.jsx`**: works like
  `CharacterDocuments.jsx`, with `CharacterContextController(characterKind, ..., 'recipes')`,
  `refreshToken`, the `ResourceExchangeModal` wired to `recipeExchangeTabs` (step 05) and
  `defaultTab="acquire"`, and a `buildRecipeExchangeCharacter` passing `canEdit` / `gameCanEdit`.
  **Difference from documents:** the "Exchange" button only renders when the character's
  `can_exchange_recipe` is true. Resolve this like `CharacterTreasures.jsx`'s
  `resolveExchangeButtonCanEdit` / `can_exchange_treasure`.
- **`components/resources/character/pages/helpers/CharacterRecipesHelper.jsx`**: `PageActions`
  (title `character_recipes_page.title`, exchange button `character_recipes_page.exchange_button`
  when allowed) plus `<ListPage type={listType} context={{ characterId }} refreshToken />`.
- **`components/common/list_types/configs/recipeListTypes.js`** (new; keep it separate from #1449's
  `recipeListType.js`): `'pc-recipes'` / `'npc-recipes'` entries. `fetchList` goes through
  `fetchRequestStoreList({resource: 'characterRecipe', params: {gameSlug, kind, id}, query:
  buildListQuery(hashResolver), canEdit: AccessStore.ensureCharacterPermissions(...)})`, with
  `photoType: 'recipe'`, `buildReadOnlyActionBarProps`,
  `buildItemInfoBarItems('character_recipes_page.hidden_label')` and `buildItemHref` →
  `#/games/:slug/:kind/:characterId/recipes/:id` (`:id` = CharacterRecipe row id). Pick a
  `wrapperClass` whose image source works with `CardRecipeImage` (`output.photo_path`, placeholder
  when `output` is null). Reuse #1449's wrapper if it only reads `output` / `name`. Otherwise add a
  `CharacterRecipeListItem.js` like `CharacterDocumentListItem.js`.
- Register the new list types in `listTypeConfig.js`, the same way `documentListTypes` is spread in.
- Empty state: `character_recipes_page.empty`.

## Files to Change
- `frontend/assets/js/components/resources/character/pages/PcCharacterRecipes.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/NpcCharacterRecipes.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterRecipes.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterRecipesHelper.jsx` — new.
- `frontend/assets/js/components/common/list_types/configs/recipeListTypes.js` — new.
- `frontend/assets/js/components/common/list_types/CharacterRecipeListItem.js` — new, only if needed.
- `frontend/assets/js/components/common/list_types/listTypeConfig.js` — register.
- Matching specs (button gating on `can_exchange_recipe`, fetch variant, hrefs, hidden badge).
