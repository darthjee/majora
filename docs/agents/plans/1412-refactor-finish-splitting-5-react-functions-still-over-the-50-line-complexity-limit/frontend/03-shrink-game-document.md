# Shrink GameDocument
`GameDocument` (`GameDocument.jsx:35`) is 53 lines and needs to lose at least 3. It owns three modal-visibility states plus `buildUploadSuccessHandler` (purge `document` cache, refetch), and the modal props are assembled inline.

Suggested extraction: a `useGameDocumentModals(controller)` hook in a new `hooks/` folder next to the existing `controllers/`, `elements/` and `helpers/`, owning `showUploadModal`, `showFileUploadModal`, `showGiveDocumentModal` and `buildUploadSuccessHandler`, and returning the open/close callbacks and the handler builder. Carry over the existing `buildUploadSuccessHandler` JSDoc (the `RequestStore.purge` rationale, issue #726) to the new file. Keep `selectedPhoto` where it is unless more room is needed.

## Files to Change
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — use the new hook; drop the moved state and handler (and the now-unused `RequestStore` import).
- `frontend/assets/js/components/resources/document/pages/hooks/useGameDocumentModals.js` — new hook.
- `frontend/specs/assets/js/components/resources/document/pages/hooks/useGameDocumentModalsSpec.js` — new spec.
