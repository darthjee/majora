# Issue: Refactor: GameDocumentModals takes 16 props — group into option objects

## Description
[`GameDocumentModals`](frontend/assets/js/components/resources/document/pages/elements/GameDocumentModals.jsx) was flagged by a Codacy code-quality finding (Lizard's `parameter-count-medium` check): the component takes 16 individual props, double the configured limit of 8.

## Problem
`GameDocumentModals` wires together four modals for the game document detail page — the photo upload modal, the PDF file-upload modal, the photo lightbox (`PhotoViewModal`), and the give-document modal. Each modal's own visibility flag, path(s), and success/close handlers are passed as separate top-level props instead of being grouped by the modal they belong to:

```jsx
export default function GameDocumentModals({
  showUploadModal, showFileUploadModal, showGiveDocumentModal,
  document, gameSlug, canGiveHidden, selectedPhoto,
  uploadPath, fileUploadPath, buildFilePhotoUploadPath,
  onUploadSuccess, onFileUploadSuccess, onUploadClose, onFileUploadClose,
  onSelectPhoto, onGiveDocumentClose,
}) {
```

This makes the signature large, obscures which props belong to which modal, and exceeds the configured parameter-count limit.

## Expected Behavior
No behavior change — the four modals render and behave exactly as they do today. Only the component's prop shape changes.

## Solution
Group `GameDocumentModals`'s props by the modal they belong to, mirroring the `uploadModal` object pattern already used by `CharacterPhotosModals` (frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx):

- `uploadModal`: `{show, path, onSuccess, onClose}` (photo upload modal)
- `fileUploadModal`: `{show, path, buildFilePhotoUploadPath, onSuccess, onClose}` (PDF file-upload modal, including its chained photo-upload path builder)
- `giveDocumentModal`: `{show, canGiveHidden, onClose}`
- `document`, `gameSlug`, `selectedPhoto`, `onSelectPhoto` stay as plain top-level props, since they're shared across modals (or belong to the photo lightbox alone) rather than to a single one of the three grouped modals

This brings the signature down to 7 top-level props (document, gameSlug, selectedPhoto, onSelectPhoto, uploadModal, fileUploadModal, giveDocumentModal), under the configured limit of 8.

Update the only caller, `GameDocument.jsx` (frontend/assets/js/components/resources/document/pages/GameDocument.jsx), to build and pass these grouped objects instead of the current 16 flat props. No new hook is introduced — the state stays as-is (plain `useState` calls in `GameDocument.jsx`); only how it's packaged for `GameDocumentModals` changes.

## Benefits
- Passes Lizard's parameter-count check (7 props, within the limit of 8)
- Each modal's own state/handlers are grouped together, making the component's structure clearer
- Consistent with the existing `uploadModal`-object pattern used by `CharacterPhotosModals`
