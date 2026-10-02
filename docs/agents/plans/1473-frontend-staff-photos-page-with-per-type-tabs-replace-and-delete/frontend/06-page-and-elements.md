# Page and elements

Build the page and its elements; keep each file small.

- `StaffPhotos.jsx` (page): state for `types`, `maxDimension`, `photoType`, `photos`, `pagination`, `loading`, `error`, `actionError`, `versions` (`{[photoId]: ts}`), the photo pending delete and the photo pending replace. Creates the controller with `useMemo` and runs `buildEffect` in `useEffect`. Renders through `StaffPhotosHelper`.
- `StaffPhotosHelper.jsx`: loading / error / render with title, tabs, action error alert (`ErrorAlert`), table (or list) of rows, empty state, and `Pagination` with `basePath="#/staff/photos"` and `extraParams={{ type: photoType }}`.
- `StaffPhotoTabs.jsx`: `<ul className="nav nav-tabs flex-wrap mb-3">`, one `<li className="nav-item"><a className="nav-link [active]" href="#/staff/photos?type=<slug>">` per type, label via the tab-label helper.
- `StaffPhotoThumbnail.jsx`: `<img>` with `src` from the thumbnail-src helper; `onError` switches state to a broken-image placeholder (a `bootstrap-icons` `bi-image` element with `staff_photos_page.broken_image_alt` as its accessible label). Guard against loops.
- `StaffPhotoStatus.jsx`: ready / not-ready badge, plus replace-in-progress badge when `replace_in_progress`.
- `StaffPhotoOwner.jsx`: link or plain text from the owner-link helper; orphan label when `owner` is null; game name when `owner.game` is present.
- Row actions: **Replace** (disabled when `replace_in_progress` or `path` is empty) opens `PhotoUploadModal` with `uploadPath = controller.replacePath(photo)`; **Delete** (disabled only when `replace_in_progress`) opens `common/modals/DeletePhotoConfirmModal`, whose confirm calls `controller.handleDelete`.
- `PhotoUploadModal`: add an optional `onError(status)` prop, threaded through `PhotoUploadModalController`, called with the `runUploadCycle` status when the result is not ok (the modal keeps its existing error display). The page passes `onSuccess` → `handleReplaceSuccess(photo)` and `onError` → `handleReplaceError(photo, status)`. Existing users of the modal are unaffected (prop optional). The old image stays in the row until the refetch after success.
- Specs for the page helper and each element (`renderToStaticMarkup`), plus `PhotoUploadModalController` specs for the new `onError` path.

## Files to Change

- `frontend/assets/js/components/resources/staff_photo/pages/StaffPhotos.jsx` — new
- `frontend/assets/js/components/resources/staff_photo/pages/helpers/StaffPhotosHelper.jsx` — new
- `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoTabs.jsx` — new
- `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoThumbnail.jsx` — new
- `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoStatus.jsx` — new
- `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoOwner.jsx` — new
- `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoRowActions.jsx` — new
- `frontend/assets/js/components/common/modals/PhotoUploadModal.jsx` — optional `onError` prop
- `frontend/assets/js/components/common/modals/controllers/PhotoUploadModalController.js` — call `onError(status)` on failure
- matching specs under `frontend/specs/assets/js/...`
