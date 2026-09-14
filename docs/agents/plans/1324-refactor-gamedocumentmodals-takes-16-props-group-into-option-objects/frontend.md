# Frontend Plan: Refactor: GameDocumentModals takes 16 props — group into option objects

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Regroup `GameDocumentModals`'s props into option objects

Change `GameDocumentModals`'s signature from 16 flat props to:

- `document` — plain prop (used by the lightbox's `alt` text and by `GiveDocumentModal`)
- `gameSlug` — plain prop (used by `GiveDocumentModal`)
- `selectedPhoto`, `onSelectPhoto` — plain props (drive the photo lightbox / `PhotoViewModal` only)
- `uploadModal` — `{show, path, onSuccess, onClose}` (photo upload modal)
- `fileUploadModal` — `{show, path, buildFilePhotoUploadPath, onSuccess, onClose}` (PDF file-upload modal, including its chained photo-upload path builder)
- `giveDocumentModal` — `{show, canGiveHidden, onClose}`

Update the destructuring and the JSX body to read from the grouped objects (e.g. `uploadModal.show`, `uploadModal.path`, `uploadModal.onSuccess`, `uploadModal.onClose`), and rewrite the component's JSDoc `@param` block to document the new shape (one `@param` per plain prop, one per grouped object listing its own fields). No behavior change — the four modals must render and behave exactly as before.

### Step 2 — Update `GameDocument.jsx` to pass the grouped objects

`GameDocument.jsx` is `GameDocumentModals`'s only caller. Update its `<GameDocumentModals ... />` call to build and pass the three grouped objects instead of the 16 flat props it currently spreads out, e.g.:

```jsx
<GameDocumentModals
  document={document}
  gameSlug={gameSlug}
  selectedPhoto={selectedPhoto}
  onSelectPhoto={setSelectedPhoto}
  uploadModal={{
    show: showUploadModal,
    path: uploadPath,
    onSuccess: buildUploadSuccessHandler(setShowUploadModal),
    onClose: () => setShowUploadModal(false),
  }}
  fileUploadModal={{
    show: showFileUploadModal,
    path: fileUploadPath,
    buildFilePhotoUploadPath,
    onSuccess: buildUploadSuccessHandler(setShowFileUploadModal),
    onClose: () => setShowFileUploadModal(false),
  }}
  giveDocumentModal={{
    show: showGiveDocumentModal,
    canGiveHidden,
    onClose: () => setShowGiveDocumentModal(false),
  }}
/>
```

The underlying `useState` calls and `buildUploadSuccessHandler` helper stay as-is — only how their values are packaged for `GameDocumentModals` changes. Update the component's top JSDoc comment if it references the old prop wiring.

## Files to Change

- `frontend/assets/js/components/resources/document/pages/elements/GameDocumentModals.jsx` — regroup the 16 props into `uploadModal`/`fileUploadModal`/`giveDocumentModal` objects plus the plain shared props; update JSX body and JSDoc accordingly
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — build and pass the three grouped objects to `GameDocumentModals` instead of the current flat props

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) — existing specs (e.g. `GameDocumentSpec.js`, `GameDocumentFileUploadModalSpec.js`, `GameDocumentGiveDocumentModalSpec.js`) exercise this wiring through `GameDocument`'s rendered behavior, not `GameDocumentModals`'s prop names directly, so no spec changes are expected — but re-run to confirm.
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- No existing spec directly unit-tests `GameDocumentModals`'s props by name, so this refactor should need no spec changes — only confirm the existing `GameDocument*Spec.js` files still pass.
- `document` and `gameSlug` stay as plain top-level props rather than being folded into `giveDocumentModal`, since `document` is also needed by the lightbox and `gameSlug` reads more naturally as page-level context than as belonging to one specific modal (confirmed during issue discussion).
