# Shrink GameEdit
`GameEdit` (`GameEdit.jsx:18`) is 51 lines and needs to lose at least 1, so it has the smallest cut. The two upload/links modal states, `handleUploadSuccess`, and the inline `onLinksConfirm` handler are one cohesive chunk.

Suggested extraction: a `useGameEditModals(controller, setLinks)` hook in `hooks/` owning `showUploadModal`/`showLinksModal` and returning the open/close callbacks plus `handleUploadSuccess` and `handleLinksConfirm`. `GameEdit` then passes them to `GameEditHelper.render` and `GameEditModals`. Behavior is unchanged: upload success still closes the modal and re-runs `controller.buildEffect()()`, and links confirm still sets links and closes the modal.

## Files to Change
- `frontend/assets/js/components/resources/game/pages/GameEdit.jsx` — use the new hook, dropping the modal state and inline handlers.
- `frontend/assets/js/components/resources/game/pages/hooks/useGameEditModals.js` — new hook.
- `frontend/specs/assets/js/components/resources/game/pages/hooks/useGameEditModalsSpec.js` — new spec.
