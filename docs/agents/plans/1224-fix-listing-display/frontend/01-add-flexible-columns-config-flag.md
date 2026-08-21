# Add flexibleColumns config flag

Add a `flexibleColumns: true` field to the two list-type configs that should keep the flexible edge-to-edge grid introduced in PR #1211. Every other config omits the field (defaults to falsy/fixed), matching pre-PR-#1211 behavior.

## Files to Change
- `frontend/assets/js/components/common/list_types/configs/gamesListType.js` — add `flexibleColumns: true` to the exported config object, alongside `itemsPerRow`/`cardPhotoClassName`.
- `frontend/assets/js/components/common/list_types/configs/myGamesListType.js` — add `flexibleColumns: true` to the exported config object, alongside `itemsPerRow`/`cardPhotoClassName`.
