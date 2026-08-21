# Update specs

Cover both the regression fix and the config additions.

In `ListPageHelperSpec.js`'s `'items per row'` describe block:
- The existing 6/2/3-count `'flexible-grid list type (games)'` cases (lines ~204-216) already exercise `games`, which will still have `flexibleColumns: true` after Step 1 — they should keep passing unchanged and don't need edits.
- Add a new case for a **fixed** (non-flexible) list type given fewer items than its `itemsPerRow`, e.g. render `'treasures'` (default `itemsPerRow` 6, no `flexibleColumns`) with 2 items and assert it still renders `col-6 col-sm-4 col-md-3 col-lg-2 mb-4` (the fixed-column class, not the flexible `col-lg-6` two-item class the current unconditional `Math.min` would wrongly produce) — this is the exact regression described in the issue and today has no covering test.

In `gamesSpec.js` (`describe('games', ...)`, alongside the existing `itemsPerRow`/`cardPhotoClassName` assertions):
- Add `it('uses the flexible column display', function() { expect(games.flexibleColumns).toBe(true); });`.

In `myGamesSpec.js` (`describe('my-games', ...)`, same location):
- Add `it('uses the flexible column display', function() { expect(myGames.flexibleColumns).toBe(true); });`.

## Files to Change
- `frontend/specs/assets/js/components/common/list_page/helpers/ListPageHelperSpec.js` — add the fixed-type-with-few-items regression case to the `'items per row'` describe block.
- `frontend/specs/assets/js/components/common/list_types/listTypeConfig/gamesSpec.js` — assert `games.flexibleColumns === true`.
- `frontend/specs/assets/js/components/common/list_types/listTypeConfig/myGamesSpec.js` — assert `myGames.flexibleColumns === true`.
