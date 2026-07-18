# Plan: Fix items per row in list pages

Issue: [681-fix-items-per-row-in-list-pages.md](../../issues/681-fix-items-per-row-in-list-pages.md)

## Overview

Make the number of items-per-row on list pages configurable per list type instead of hardcoded. Add an `itemsPerRow` field to the `listTypeConfig` entries (default 6), and have `ListPageHelper` pick the largest-breakpoint Bootstrap column class (`col-lg-2` for 6, `col-lg-3` for 4) from it. Set `itemsPerRow: 4` on the `games`, `pcs`, and `npcs` list types only; every other list type keeps the current 6-per-row behavior.

## Context

All list pages share `ListPage`/`ListPageHelper`
(`frontend/assets/js/components/common/list_page/`), driven by a per-type config object in
`frontend/assets/js/components/common/list_types/listTypeConfig.js` (plus per-type files under
`./configs/`). `ListPageHelper.#renderItem` currently applies the same hardcoded grid class to
every list type:

```jsx
<div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4" key={rawItem.id}>
```

`col-lg-2` (12/2) yields 6 items per row on large screens; smaller breakpoints already show
fewer items (2 on xs, 3 on sm, 4 on md) and are not changing. Per the issue, `/#/` (home, which
renders `Games` under the hood), `/#/games`, `/#/games/:game_slug/pcs`, and
`/#/games/:game_slug/npcs` need 4 items per row instead of 6. These map to list-type config keys
`games`, `pcs`, and `npcs` respectively — `/#/` and `/#/games` both use the `games` config entry,
so setting `itemsPerRow` on that single entry covers both routes.

Only the largest breakpoint's column count changes; `col-6 col-sm-4 col-md-3` stays the same for
every list type.

## Implementation Steps

### Step 1 — Add `itemsPerRow` to the list-type config shape

In `frontend/assets/js/components/common/list_types/listTypeConfig.js`, add `itemsPerRow: 6` to
the four inline entries (`treasures`, `items`, `pc-items`, `npc-items`) and document the new
field in the config-shape doc comment above `listTypeConfig`. Add `itemsPerRow: 6` to
`characterTreasureListTypes.js` (`pc-treasures`, `npc-treasures`) and `globalTreasureListType.js`
(`treasures-global`), since these also keep the 6-per-row default.

### Step 2 — Set the 4-per-row overrides

In `configs/gamesListType.js`, set `itemsPerRow: 4` on the `games` entry. In
`configs/characterListTypes.js`, set `itemsPerRow: 4` on both the `pcs` and `npcs` entries.

### Step 3 — Make `ListPageHelper` read the config value

In `ListPageHelper.jsx`, replace the hardcoded `col-lg-2` in `#renderItem` with a lookup based on
`config.itemsPerRow`: 4 → `col-lg-3`, 6 (default) → `col-lg-2`. Keep `col-6 col-sm-4 col-md-3`
fixed for every list type. Add a small private helper (e.g. `#largeColumnClass(itemsPerRow)`) so
the mapping is explicit and easy to extend if a third category is ever needed.

### Step 4 — Update/add specs

- `ListPageHelperSpec.js`: add a case asserting that a list type with `itemsPerRow: 4` (e.g.
  `'games'` or `'pcs'`) renders `col-lg-3` instead of `col-lg-2`, and that the default
  (`'treasures'`) still renders `col-lg-2`. Confirm `col-6 col-sm-4 col-md-3` is unchanged in
  both cases.
- `listTypeConfig/gamesSpec.js`, `listTypeConfig/pcsSpec.js`, `listTypeConfig/npcsSpec.js`: add an
  assertion that `itemsPerRow` is `4`.
- `listTypeConfig/treasuresSpec.js`, `itemsSpec.js`, `characterItemsSpec.js`,
  `characterTreasuresSpec.js`, `treasuresGlobalSpec.js`: add an assertion that `itemsPerRow` is
  `6` (default), to lock in the not-4 list types.

## Files to Change

- `frontend/assets/js/components/common/list_types/listTypeConfig.js` — add `itemsPerRow: 6` to
  the four inline entries; update the config-shape doc comment.
- `frontend/assets/js/components/common/list_types/configs/gamesListType.js` — add
  `itemsPerRow: 4`.
- `frontend/assets/js/components/common/list_types/configs/characterListTypes.js` — add
  `itemsPerRow: 4` to `pcs` and `npcs`.
- `frontend/assets/js/components/common/list_types/configs/characterTreasureListTypes.js` — add
  `itemsPerRow: 6` to `pc-treasures` and `npc-treasures`.
- `frontend/assets/js/components/common/list_types/configs/globalTreasureListType.js` — add
  `itemsPerRow: 6` to `treasures-global`.
- `frontend/assets/js/components/common/list_page/helpers/ListPageHelper.jsx` — read
  `config.itemsPerRow` and pick `col-lg-2`/`col-lg-3` accordingly instead of a hardcoded class.
- `frontend/specs/assets/js/components/common/list_page/helpers/ListPageHelperSpec.js` — new
  coverage for the 4-per-row vs 6-per-row column class.
- `frontend/specs/assets/js/components/common/list_types/listTypeConfig/*.js` — new `itemsPerRow`
  assertions for each affected list type spec file (`gamesSpec.js`, `pcsSpec.js`, `npcsSpec.js`,
  `treasuresSpec.js`, `itemsSpec.js`, `characterItemsSpec.js`, `characterTreasuresSpec.js`,
  `treasuresGlobalSpec.js`).

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)

## Notes

- `pc-items`/`npc-items` (character items lists) and the global/character treasures list types
  are not mentioned in the issue's 4-per-row exception list, so they stay at the 6-per-row
  default.
- Only the largest breakpoint (`lg`) changes; `col-6 col-sm-4 col-md-3` is identical for every
  list type both before and after this change, per explicit confirmation during issue discussion.
