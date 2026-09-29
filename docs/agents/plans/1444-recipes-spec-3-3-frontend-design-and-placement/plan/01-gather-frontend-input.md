# Gather frontend input
Dispatch the **frontend** agent (read-only question, no edits) to map each recipe UI element to
the closest existing component/pattern, so the spec can cite concrete files:

- Header nav: `HeaderNavHelper.jsx` — `gameItem('recipes', '/recipes', 'game_page.recipes')` next
  to `common-items`; `characterItems` gains a `recipes` entry for PC/NPC dropdowns.
- Routes: where game and character routes are registered (`AppHelper.jsx` / route config) and
  the new paths `#/games/:gameSlug/recipes`, `/recipes/new`, `/recipes/:id`, `/recipes/:id/edit`,
  `#/games/:gameSlug/pcs|npcs/:id/recipes`.
- Game recipe list: `GameCommonItems.jsx` (list + thumbnail) and `TaskFilters.jsx` /
  `TaskFiltersHelper.jsx` (category filter).
- Show/New/Edit: `GameDocument.jsx`, `GameDocumentNew.jsx`, `GameDocumentEdit.jsx` minus
  pages/files/photos/upload; `CommonItemPriceField.jsx` (`TreasureMoney` + `MoneyEditModal`,
  `context="treasure"`) for `crafting_cost`; `CommonItemDescriptionField.jsx` (`MarkdownEditor`)
  for `description`/`ingredients`/`checks`; an output selector over the game's common items
  (find an existing picker, e.g. the acquire-tab search pattern).
- Character recipes: `CharacterDocuments.jsx` / `PcCharacterDocuments.jsx` /
  `NpcCharacterDocuments.jsx` (full page), the `*_preview` shortlist sections on the character
  show page, `ResourceExchangeModal.jsx` + `documentExchangeTabs.js` + `AcquireDocumentTab.jsx` /
  `RemoveDocumentTab.jsx` (acquire/remove tabs; Remove searches with `?name=`), and the hidden
  toggle pattern used by other character sub-resources.
- "Known by" mixed PC/NPC list and the common item "Recipes" shortlist: closest existing
  cross-entity shortlist component.
- Request wiring: `utils/requests/config/*Config.js` (e.g. `documentConfig.js`,
  `commonItemConfig.js`) and `utils/requests/RequestPermissionResolvers.js`; how
  `can_create_recipe` (game permissions) and `can_exchange_recipe` / `can_edit`
  (character permissions) are read via `AccessStore`.
- i18n: file-per-page layout under `frontend/assets/i18n/{en,pt}/`.

## Files to Change
- None (investigation only).
