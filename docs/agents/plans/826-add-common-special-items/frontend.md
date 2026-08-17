# Frontend Plan: Add common special items

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the backend API surface from [plan.md](plan.md) (routes, field names, permissions
config key `game_common_item`) to build the resource config and pages below. Produces the route
names and i18n namespaces documented there for [translator](translator.md) to fill in.

## Implementation Steps

### Step 1 — Resource config

`frontend/assets/js/utils/requests/config/commonItemConfig.js` — much simpler than
`possessionConfig.js`/`itemConfig.js`, since `GameCommonItem` has **no character-owned family at
all**: no `kind` branching, no `availableCollection`/`acquire`/`remove`. It only needs the
unconditionally-game-level halves of `possessionConfig.js`'s shape:
- `GET.collection` — `regular` → `/games/:game_slug/common_items.json`, `private` →
  `/games/:game_slug/common_items/all.json` (`permission: 'can_edit'`)
- `GET.single` — `regular` → `/games/:game_slug/common_items/:id.json`, `private` →
  `/games/:game_slug/common_items/:id/full.json` (`permission: 'can_edit'`)
- `PATCH.single` — same path as `GET.single`'s `regular`, `permission: 'can_edit'`
- `POST.collection` (create) — same path as `GET.collection`'s `regular`, `permission: 'can_edit'`
- `POST.single` (photo upload init) — `/games/:game_slug/common_items/:id/photo_upload.json`,
  `permission: null`

Register it in `resourceConfig.js` under a `gameCommonItem` (or `commonItem`, match whatever
naming convention `resourceConfig.js` uses for its keys) resource name.

### Step 2 — Permission resolver

`frontend/assets/js/utils/requests/RequestPermissionResolvers.js` — add the `gameCommonItem`
entry exactly as decided in [plan.md](plan.md)/the issue (unconditionally game-level for both
`collection` and `single`, no `kind` branching).

### Step 3 — Routes

`frontend/assets/js/utils/routing/HashRouteResolver.js` — add, mirroring the `possessions` block:
```
['/games/:game_slug/common_items/new', 'gameCommonItemNew'],
['/games/:game_slug/common_items/:id/edit', 'gameCommonItemEdit'],
['/games/:game_slug/common_items/:id', 'gameCommonItem'],
['/games/:game_slug/common_items', 'gameCommonItems'],
```
`frontend/assets/js/components/helpers/AppHelper.jsx` — import and register the 4 new page
components under those same keys.

### Step 4 — Pages

`frontend/assets/js/components/resources/common_item/pages/` (new folder, mirroring
`resources/possession/pages/` — game-level only, no `resources/character/pages/*CommonItem*`
counterpart needed):
- `GameCommonItems.jsx` (+ `controllers/GameCommonItemsController.js`, `helpers/
  GameCommonItemsHelper.jsx`) — list page, mirroring `GamePossessions.jsx`. List rows should
  surface `price` (via `TreasureMoney`) and `category` alongside `name`/photo thumbnail, since
  browsing prices is the whole point of this catalog (unlike the possession list, which only
  shows name/photo).
- `GameCommonItem.jsx` (+ `helpers/CommonItemDetailHelper.jsx`) — show page, mirroring
  `GamePossession.jsx`, with `elements/show/` field components: `CommonItemNameField.jsx`,
  `CommonItemDescriptionField.jsx`, `CommonItemHiddenField.jsx`, `CommonItemPhoto.jsx`,
  `CommonItemPriceField.jsx` (new — displays via `TreasureMoney`, edit mode reuses
  `MoneyEditModal`; decide whether to reuse its existing `context: 'treasure'` config or add a
  new context — check `DndMoneyModel`'s `CONTEXT_CONFIGS` before adding one, since `'treasure'`
  may already fit), `CommonItemCategoryField.jsx` (new — a `<select>` over the 7 fixed category
  values, labels from i18n, see [translator.md](translator.md)).
- `GameCommonItemNew.jsx` (+ `controllers/GameCommonItemNewController.js`, `helpers/
  GameCommonItemNewHelper.jsx`) — mirroring `GamePossessionNew.jsx`, form fields: name,
  description, price, category, hidden (no photo — matches possession's own new-page omission).
- `GameCommonItemEdit.jsx` (+ controller/helper) — mirroring `GamePossessionEdit.jsx`.

### Step 5 — Shared list/card/show-type configs

Mirror the possession equivalents, adding `price`/`category` where the possession version only
has `name`/photo:
- `frontend/assets/js/components/common/cards/CardCommonItemImage.jsx`,
  `CommonItemPreviewCard.jsx` (+ helper)
- `frontend/assets/js/components/common/list_types/GameCommonItemListItem.js` +
  `configs/commonItemListType.js`
- `frontend/assets/js/components/common/show_page/show_types/configs/commonItemShowType.js`

### Step 6 — Specs

Jasmine specs alongside every new file above, following this repo's co-located `*.spec.js(x)`
convention (mirror the existing `*Possession*.spec.*` files 1:1 for structure).

## Files to Change

- `frontend/assets/js/utils/requests/config/commonItemConfig.js` — new
- `frontend/assets/js/utils/requests/resourceConfig.js` — register it
- `frontend/assets/js/utils/requests/RequestPermissionResolvers.js` — add `gameCommonItem`
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — new routes
- `frontend/assets/js/components/helpers/AppHelper.jsx` — new page imports/registrations
- `frontend/assets/js/components/resources/common_item/pages/**` — new page/controller/helper set
- `frontend/assets/js/components/common/cards/*CommonItem*` — new
- `frontend/assets/js/components/common/list_types/*CommonItem*` — new
- `frontend/assets/js/components/common/show_page/show_types/configs/commonItemShowType.js` — new
- Jasmine specs mirroring every file above

## CI Checks

- `frontend`: `npm test` / `npx jasmine` (CI job `jasmine`)
- `frontend`: `npm run lint` (CI job `frontend-checks`)

## Notes

- No `resources/character/pages/*CommonItem*` — `GameCommonItem` has no character-owned variant,
  confirmed out of scope by the issue.
- Confirm with [translator](translator.md) the exact i18n key names before wiring labels, so the
  page components and the yaml files land with matching keys in the same PR.
