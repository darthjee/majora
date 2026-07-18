# Issue: Fix items per row in list pages

## Description
List pages across the app share a common `ListPage` component (`frontend/assets/js/components/common/list_page/ListPage.jsx`), which renders its grid via `ListPageHelper` (`frontend/assets/js/components/common/list_page/helpers/ListPageHelper.jsx`). Each page's behavior is driven by a per-list-type configuration entry (e.g. `games`, `pcs`, `npcs`, `treasures`, `pc-treasures`, `npc-treasures`, `items`, `pc-items`, `npc-items`, `treasures-global`) defined under `frontend/assets/js/components/common/list_types/`.

### Examples of list pages
- `/#/` (home, uses the `games` list type)
- `/#/games` (`games` list type)
- `/#/games/:game_slug/pcs` (`pcs` list type)
- `/#/games/:game_slug/npcs` (`npcs` list type)
- `/#/games/:game_slug/pcs/:id/treasures` (`pc-treasures` list type)

## Problem
All list pages currently render 6 items per row, via a hardcoded, uniform Bootstrap column class applied by `ListPageHelper` regardless of list type:

```jsx
<div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4" key={rawItem.id}>
```

(`col-lg-2` = 12/2 = 6 items per row on large screens.) There is no per-list-type override — the class string is identical for every list type. We need two categories of list pages: one with 6 items per row (current default) and one with 4 items per row.

### List pages that need 4 items per row
- `/#/` (`games` list type)
- `/#/games` (`games` list type)
- `/#/games/:game_slug/pcs` (`pcs` list type)
- `/#/games/:game_slug/npcs` (`npcs` list type)

All other list types (`treasures`, `pc-treasures`, `npc-treasures`, `items`, `pc-items`, `npc-items`, `treasures-global`) keep the current 6-items-per-row behavior as the default.

## Expected Behavior
- List pages backed by the `games`, `pcs`, and `npcs` list types render 4 items per row on large screens.
- All other list pages continue to render 6 items per row on large screens (unchanged default).
- Smaller breakpoints (xs/sm/md) are unaffected — only the largest breakpoint's column count changes for the 4-per-row category. Items on xs/sm/md continue to render at today's 2/3/4 items per row respectively, for every list type.

## Solution
Add an `itemsPerRow` (or similarly named) field to the list-type configuration objects under `frontend/assets/js/components/common/list_types/` (base map `listTypeConfig.js` and the per-type files in `./configs/`), defaulting to 6 when unset. Update `ListPageHelper` to read this value from the active list type's config and choose the corresponding Bootstrap column class for the largest breakpoint (`col-lg-2` for 6 items per row, `col-lg-3` for 4 items per row), leaving the `col-6 col-sm-4 col-md-3` portion of the class string unchanged. Set the new field to 4 for the `games`, `pcs`, and `npcs` config entries.

## Benefits
- Larger, more legible cards on the list pages where 6-per-row currently feels cramped (home, games, PCs, NPCs).
- Keeps the existing compact 6-per-row layout for list types where it already works well (treasures, items).
- Centralizes the per-row behavior in configuration, avoiding hardcoded, page-specific overrides in the future.
