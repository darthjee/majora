# "Recipes that produce it" shortlist on the common item page
Add a recipe shortlist to the common item show page, backed by
`recipe.commonItemCollection`. The existing shortlist plumbing needs two small generalizations.

- **`ShortListController` resource / quantity type:** it currently calls
  `RequestStore.ensure({resource: this.resource, quantityType: 'collection', ...})`, using the
  slot key as the RequestStore resource. Let a `shortListResourceConfig` entry optionally declare
  `requestResource` and `quantityType` (defaulting to the slot key and `'collection'`), so the
  `commonItemRecipe` slot fetches `recipe.commonItemCollection`. Existing entries are unchanged.
- **Optional "See all":** there is no full "recipes producing this item" page. Make
  `buildSeeAllHref` optional in `ShortList.jsx`, and have `PreviewSection` (and its helper) skip
  the `SeeAllCard` when `seeAllCard` / its `href` is absent.
- **Context `game_slug`:** `ShortList` reads `game_slug` / `id` from the page context, but the
  common item serializer has no `game_slug`. Have `CommonItemDetailHelper.render` (or
  `GameCommonItem.jsx`) add `game_slug` (from the hash) to the `ShowPageLayout` context.
- `shortListResourceConfig.js`: new `commonItemRecipe` entry — `titleKey:
  'common_item_recipes_preview.title'`, an icon (new `PREVIEW_LIST_TYPES.commonItemRecipe` in
  `characterPreviewConstants.js`), `emptyTextKey: 'common_item_recipes_preview.empty'`,
  `action: 'navigate'`, `requestResource: 'recipe'`, `quantityType: 'commonItemCollection'`,
  `buildParams: (ctx) => ({gameSlug: ctx.game_slug, commonItemId: ctx.id})`, no `buildSeeAllHref`,
  `buildHref` → `#/games/:slug/recipes/:item.id`, `renderItem` → new
  `components/common/cards/RecipePreviewCard.jsx` (thumbnail via `CardRecipeImage` + name, like
  `CommonItemPreviewCard.jsx`).
- `commonItemShowType.js`: add `{ Show: buildShortListSlot('commonItemRecipe') }` to `right`
  (after the category field, before the New-only fields).
- Editors get `.../recipes/all.json?per_page=5` through the `recipe.commonItemCollection`
  resolver.

## Files to Change
- `components/common/cards/controllers/ShortListController.js` — optional `requestResource` /
  `quantityType`.
- `components/common/cards/ShortList.jsx`, `PreviewSection.jsx` (+ its helper) — optional
  "See all".
- `components/common/cards/shortListResourceConfig.js` — `commonItemRecipe` entry.
- `components/common/cards/characterPreviewConstants.js` — `commonItemRecipe` title / icon.
- `components/common/cards/RecipePreviewCard.jsx` — new.
- `components/common/show_page/show_types/configs/commonItemShowType.js` — shortlist slot.
- `components/resources/common_item/pages/helpers/CommonItemDetailHelper.jsx` — `game_slug` in
  context.
- Matching specs (including regressions for the existing shortlists).
