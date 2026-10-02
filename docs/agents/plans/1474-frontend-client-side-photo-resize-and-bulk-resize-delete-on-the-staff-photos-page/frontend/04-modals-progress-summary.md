# Confirmation modals, progress and result summary

- **Single resize confirmation**: a new `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoResizeConfirmModal.jsx` (Bootstrap modal in the same style as `DeletePhotoConfirmModal`) with `resize_confirm_title` and `resize_confirm_body` (`{{max}}` → `maxDimension`). Confirm → `controller.handleResize(photo)`. The page holds `pendingResize` state, like `pendingDelete` / `pendingReplace`.
- **Bulk confirmation**: a new `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkConfirmModal.jsx` taking `{ action, photos }`. Its title and body come from `bulk_confirm_<action>_title` / `_body` (`{{count}}`, `{{max}}`). Confirm → `controller.runBulk(action, photos)`. The page holds `pendingBulk` state.
- **Progress**: a new `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkProgress.jsx`, rendered while `bulkJob` is set. It shows a Bootstrap progress bar plus `bulk_progress` (`{{done}}` / `{{total}}`).
- **Result summary**: a new `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkSummary.jsx`, rendered when `bulkResult` is set. It groups outcomes into `summary_resized` / `summary_deleted` (by action), `summary_skipped` and `summary_failed`. Each entry shows the photo id and owner (reuse `StaffPhotoOwner`) and, for skipped / failed entries, the translated reason. A `summary_close` button clears `bulkResult`.

Specs for each new element (rendering per state and the confirm / cancel / close callbacks) and for the page wiring.

## Files to Change

- `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoResizeConfirmModal.jsx` — new.
- `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkConfirmModal.jsx` — new.
- `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkProgress.jsx` — new.
- `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkSummary.jsx` — new.
- `frontend/assets/js/components/resources/staff_photo/pages/StaffPhotos.jsx` — `pendingResize` / `pendingBulk` state and modal / progress / summary rendering.
- `frontend/assets/js/components/resources/staff_photo/pages/helpers/StaffPhotosHelper.jsx` — place progress and summary in the page layout.
- `frontend/specs/assets/js/components/resources/staff_photo/pages/elements/*Spec.js` — new specs for each element; `frontend/specs/assets/js/components/resources/staff_photo/pages/StaffPhotosSpec.js` — extended.
