# Shrink GameCommonItemEdit
`GameCommonItemEdit` (`GameCommonItemEdit.jsx:24`) is 54 lines and needs to lose at least 4. It holds the upload and price modal states, `handleUploadSuccess`, the inline `onPriceConfirm` handler, and the `uploadPath` template string.

Suggested extraction: a `useCommonItemEditModals(controller, setField)` hook in the existing `hooks/` folder (next to `useApplyLoadedCommonItem.js`), owning `showUploadModal`/`showPriceModal`, and returning the open/close callbacks, `handleUploadSuccess` and `handlePriceConfirm`. The `uploadPath` string can also move to a static on `GameCommonItemEditController` (as `GameDocumentController.buildPaths` does for documents).

The hook must be called above the `if (loading)` / `if (error)` early returns. `handleUploadSuccess` is currently defined after them, so it has to move up with the hook rather than staying where it is.

## Files to Change
- `frontend/assets/js/components/resources/common_item/pages/GameCommonItemEdit.jsx` — use the new hook; drop the moved state and handlers.
- `frontend/assets/js/components/resources/common_item/pages/hooks/useCommonItemEditModals.js` — new hook.
- `frontend/assets/js/components/resources/common_item/pages/controllers/GameCommonItemEditController.js` — optional static for the upload path.
- `frontend/specs/assets/js/components/resources/common_item/pages/hooks/useCommonItemEditModalsSpec.js` — new spec.
