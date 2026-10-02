# Move DeletePhotoConfirmModal to common/modals

Move the modal so the staff page can reuse it. Behaviour and i18n keys (`delete_photo_confirm_modal.*`, in `common.yaml`) are unchanged. Use `git mv`.

- `components/resources/character/pages/elements/DeletePhotoConfirmModal.jsx` → `components/common/modals/DeletePhotoConfirmModal.jsx`
- `components/resources/character/pages/elements/helpers/DeletePhotoConfirmModalHelper.jsx` → `components/common/modals/helpers/DeletePhotoConfirmModalHelper.jsx` (fix the Translator import path to `'../../../../i18n/Translator.js'` or whatever depth is correct)
- Update the only importer, `components/resources/character/pages/shared/CharacterPhotos.jsx`.
- Move the two specs accordingly and fix their relative imports.
- Optionally update the JSDoc mentions in `faction/pages/elements/KickConfirmModal.jsx` and its helper.

## Files to Change

- `frontend/assets/js/components/common/modals/DeletePhotoConfirmModal.jsx` — moved
- `frontend/assets/js/components/common/modals/helpers/DeletePhotoConfirmModalHelper.jsx` — moved, import path fixed
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — import updated
- `frontend/specs/assets/js/components/common/modals/DeletePhotoConfirmModalSpec.js` — moved
- `frontend/specs/assets/js/components/common/modals/helpers/DeletePhotoConfirmModalHelperSpec.js` — moved
