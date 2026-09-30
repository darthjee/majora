# Shortlists: PC/NPC "Recipes" and recipe "Known by"

Two new `ShortList` entries (`MAX_PREVIEW_ITEMS = 5`, `query: {per_page: 5}`).

- **`components/common/cards/characterPreviewConstants.js`** (`PREVIEW_LIST_TYPES`):
  - `recipe`: `titleKey: 'character_page.recipes_title'`, `icon: Icons.bookHalf` (same icon as
    `commonItemRecipe`).
  - `recipeCharacter`: `titleKey: 'recipe_page.known_by_title'`, a people icon (e.g.
    `Icons.peopleFill`).
- **`components/common/cards/shortListResourceConfig.js`**:
  - `recipe`: `requestResource: 'characterRecipe'`, `quantityType: 'collection'`,
    `buildParams: characterResourceParams`, `emptyTextKey: 'character_recipes_preview.empty'`,
    `buildSeeAllHref: (ctx) => characterResourceSeeAllHref('recipe', ctx)`, `buildHref` →
    `#/games/:slug/:kind/:id/recipes/:item.id`, and `renderItem` → `RecipePreviewCard`. Masked
    output falls back to the placeholder, which `RecipePreviewCard` already handles.
    `requestResource` is required because the default would be `recipe.collection`.
  - `recipeCharacter`: `requestResource: 'recipe'`, `quantityType: 'characters'`,
    `buildParams: (ctx) => ({ gameSlug: ctx.game_slug, id: ctx.id })`,
    `emptyTextKey: 'recipe_characters_preview.empty'`, **no** `buildSeeAllHref`. This is the first
    mixed PC/NPC shortlist, so `buildHref` branches on `item.type`
    (`'npc'` → `npcs`, otherwise `pcs`, like `FactionCharacterCardHelper.jsx#buildHref`) and
    `renderItem` uses `renderCharacterPreviewCard(item.type, item, context)`.
- **Show types**: add `{ Show: buildShortListSlot('recipe') }` after `document` in the `right`
  arrays of `pcShowType.js` and `npcShowType.js`. Add `{ Show: buildShortListSlot('recipeCharacter') }`
  to `recipeShowType.js`'s `right` array (after `RecipeHiddenBadge`) and remove its "Known by …
  intentionally absent (#1450)" comment.
- Check that the PC/NPC show page context exposes `is_pc` / `game_slug` / `id` for the new slot,
  like the `document` slot does, and that the recipe show page context exposes `game_slug` / `id`.

## Files to Change
- `frontend/assets/js/components/common/cards/characterPreviewConstants.js` — two entries.
- `frontend/assets/js/components/common/cards/shortListResourceConfig.js` — two entries.
- `frontend/assets/js/components/common/show_page/show_types/configs/pcShowType.js` — slot.
- `frontend/assets/js/components/common/show_page/show_types/configs/npcShowType.js` — slot.
- `frontend/assets/js/components/common/show_page/show_types/configs/recipeShowType.js` — slot + comment.
- Matching specs (request resource/quantity type, hrefs per `type`, no see-all for "Known by").
