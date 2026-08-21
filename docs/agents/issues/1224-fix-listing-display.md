# Issue: Fix listing display: flexible column grid leaks to non-game list types

## Description
In issue #774, PR #1211, and commit `7dd877b2e2775e1e72f4f9aefd1b92c3f1a27624`, a flexible grid display was introduced that adapts the number of columns per row to the number of items being rendered — reducing the column count so cards fill the row edge-to-edge when fewer items exist than the row's normal capacity.

This was intended to affect only the pages `/#/` (home) and `/#/games` (games list). However, the implementation applies the flexible logic to **all** ~20 list types that share the `ListPage`/`ListPageHelper` component, because `ListPageHelper.#breakpointColumnClass` applies `Math.min(normal, itemsCount)` unconditionally, without checking whether the list type opted into the flexible behavior.

**Related:** original issue #774 (closed), introducing PR #1211 (merged), introducing commit `7dd877b2e2775e1e72f4f9aefd1b92c3f1a27624`.

## Problem
`ListPageHelper` is shared across all list types in the app. Each list type is configured via `listTypeConfig.js` with properties like `itemsPerRow`, `wrapperClass`, `fetchList`, etc.

The flexible column logic added in `#breakpointColumnClass`:

```jsx
static #breakpointColumnClass(prefix, normal, itemsCount) {
    const effectiveColumns = Math.min(normal, itemsCount);
    const width = 12 / effectiveColumns;
    return prefix ? `col-${prefix}-${width}` : `col-${width}`;
}
```

runs for **every** list type, not just `games` and `my-games`. When a non-game list type (e.g. `treasures`, `items`, `documents`) has fewer items than its normal per-row count, the grid columns expand to fill the row — behavior that was intended only for the games pages.

**Example:** a treasures list (`itemsPerRow: 6`) with 2 items previously rendered 2 cards in a 6-column grid (with visible empty space). After PR #1211, those 2 cards now expand to fill the entire row, which is not the intended behavior for non-game list types.

**Affected code:**
- `frontend/assets/js/components/common/list_page/helpers/ListPageHelper.jsx` — `#breakpointColumnClass` applies `Math.min` unconditionally
- `frontend/assets/js/components/common/list_page/ListPage.jsx` — delegates to `ListPageHelper.render()`
- `frontend/assets/js/components/common/list_types/listTypeConfig.js` — central config registry; no `flexibleColumns` flag exists
- `frontend/assets/js/components/common/list_types/configs/gamesListType.js` — `itemsPerRow: 4`, `cardPhotoClassName: 'card-photo-rect'`
- `frontend/assets/js/components/common/list_types/configs/myGamesListType.js` — `itemsPerRow: 4`, `cardPhotoClassName: 'card-photo-rect'`

## Expected Behavior
- Only the `games` and `my-games` list types (pages `/#/`, `/#/games`, `/#/my-games`) use the flexible column display, where `Math.min(normal, itemsCount)` is applied per breakpoint.
- All other list types (~18: `treasures`, `items`, `pc-items`, `npc-items`, `documents`, `possessions`, `commonItems`, `players`, `pcs`, `npcs`, `pc-treasures`, `npc-treasures`, `treasures-global`, `stlModels`, `sources`, `collections`, `factions`, etc.) revert to their pre-PR-#1211 behavior: fixed column classes regardless of item count.
- No changes to backend, permissions, or endpoints — purely presentational.

## Solution
Add a `flexibleColumns: true` flag to `gamesListType.js` and `myGamesListType.js`. Thread the flag from the config through `ListPageHelper#columnClassName` and `#breakpointColumnClass`:

- If `flexibleColumns` is `true`, apply `Math.min(normal, itemsCount)` (current behavior).
- If `flexibleColumns` is `false` or omitted, use `normal` directly (pre-PR-#1211 behavior).

This is consistent with the existing per-type configuration pattern (e.g. `itemsPerRow`, `cardPhotoClassName`) and is self-documenting.

**Changes required:**
1. `configs/gamesListType.js` — add `flexibleColumns: true`
2. `configs/myGamesListType.js` — add `flexibleColumns: true`
3. `ListPageHelper.jsx`:
   - `#renderItem` already receives `config` — pass `config.flexibleColumns` to `#columnClassName`
   - `#columnClassName` — accept the `flexibleColumns` flag and pass it to `#breakpointColumnClass`
   - `#breakpointColumnClass` — conditionally apply `Math.min` based on the flag

**Tests to update:**
- `ListPageHelperSpec.js` — ensure fixed types with few items keep their normal column classes; ensure flexible types still adapt
- `gamesSpec.js` / `myGamesSpec.js` — assert the new `flexibleColumns` config field

**Permissions / performance / security:** not applicable — purely presentational (grid layout), no new data exposed, no endpoint or access-control change, no new requests.

## Benefits
- Restores the intended pre-PR-#1211 fixed-grid layout for the ~18 non-game list types, fixing the visual regression.
- Keeps the flexible edge-to-edge layout for `games`/`my-games`, where it was actually intended.
- Self-documenting, per-type config flag — no special-casing by list-type name inside `ListPageHelper`.
