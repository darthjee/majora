# Extract GameDocument's path-building into a helper

`GameDocument` (`frontend/assets/js/components/resources/document/pages/GameDocument.jsx:36`, 54 lines) inlines four path computations right before its `return` (lines 79–84): `editHref`, `uploadPath`, `fileUploadPath`, and the `buildFilePhotoUploadPath` closure, all derived from `gameSlug` and `document`.

Extract these into a static helper on the existing controller class, mirroring the pattern already used for `GameDocumentController.getParamsFromHash` (called on line 57): add `GameDocumentController.buildPaths(gameSlug, document)` returning `{ editHref, uploadPath, fileUploadPath, buildFilePhotoUploadPath }`, moving the `resourceConfig` lookups into it unchanged. `GameDocument` then does:

```js
const { editHref, uploadPath, fileUploadPath, buildFilePhotoUploadPath } =
  GameDocumentController.buildPaths(gameSlug, document);
```

replacing the four inline computations. `backHref` (line 58, derived only from `gameSlug`, used before the loading/error early returns) stays where it is — it's needed earlier in the function and isn't part of this cohesive chunk.

## Files to Change

- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentController.js` — add the `buildPaths(gameSlug, document)` static method, per above.
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — replace the four inline path computations with a single `GameDocumentController.buildPaths` call.
