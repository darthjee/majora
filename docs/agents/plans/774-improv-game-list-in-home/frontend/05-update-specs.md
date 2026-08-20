# Update/add Jasmine specs

Cover the new formula, the new prop, and the new config field:

- Extend the existing `col-lg-3`/`col-lg-2` assertions in
  `ListPageHelperSpec.js` with cases for 1/2/3-item counts producing
  `col-12`/`col-6`/`col-4` (and their `sm`/`md` equivalents) for a
  flexible-grid-configured type, while asserting a fixed (non-games) type's
  columns stay constant regardless of item count — this is the
  backward-compatibility guarantee from Step 1.
- Add a case to `CardPhotoSpec.js` asserting the `className` prop override
  renders the passed class, and that omitting it still defaults to
  `card-photo-square`.
- Add assertions in `gamesSpec.js` and `myGamesSpec.js` (under
  `list_types/listTypeConfig/`) for the new `cardPhotoClassName` field.
- Run the existing `GamesSpec.js`/`GamesHelperSpec.js` and confirm they
  still pass unchanged (no prop-shape change at that level).

## Files to Change

- `frontend/specs/assets/js/components/common/list_page/helpers/ListPageHelperSpec.js` — add count-driven column-class cases.
- `frontend/specs/assets/js/components/common/cards/CardPhotoSpec.js` — add `className` prop coverage.
- `frontend/specs/assets/js/components/common/list_types/listTypeConfig/gamesSpec.js` — assert `cardPhotoClassName`.
- `frontend/specs/assets/js/components/common/list_types/listTypeConfig/myGamesSpec.js` — assert `cardPhotoClassName`.
