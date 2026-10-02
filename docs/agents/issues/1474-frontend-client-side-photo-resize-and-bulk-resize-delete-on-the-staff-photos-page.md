# Issue: Frontend: client-side photo resize and bulk Resize / Delete on the staff photos page

## Description

Part of #1468 (staff page to manage photos). Builds on the staff photos page from #1473 (per-type tabs, per-row Replace / Delete), the staff photo endpoints from #1470, and the proxy photo work from #1471 / #1472. All of these are merged.

Add a client-side **Resize** action (per row and in bulk) and a bulk **Delete** action to the staff photos page (`frontend/assets/js/components/resources/staff_photo/pages/`).

## Problem

Staff can replace or delete photos one at a time, but they cannot shrink oversized photos, and they have no way to act on several photos at once. Neither the server nor the proxy has an image-processing library (no GD/Imagick in the Tent proxy, no Pillow in the backend), so a server-side resize isn't available.

## Expected Behavior

### Resize (single photo)

- Each row gets a **Resize** action next to Replace / Delete. It opens a confirmation dialog first, because the resize overwrites the original.
- Target: longest side ≤ **N px**. N is `max_dimension` from `GET /staff/photos.json` (backend setting `MAJORA_PHOTO_MAX_DIMENSION`, default 1024). The page already loads it into state, and it must not be hard-coded.
- The aspect ratio is kept (the image fits inside an N×N box), and images are **never upscaled**.
- Output keeps the original format: JPEG / WebP are re-encoded at quality ≈ 0.85, and PNG stays PNG with transparency kept. The filename extension is unchanged, so the file is overwritten in place.
- **Skipped** (no upload), each with an info message on the single action:
  - images already within the limit;
  - `.gif` photos (a canvas resize would flatten the animation);
  - not-ready photos, photos with an empty `path`, and photos with `replace_in_progress: true`. For these rows the Resize action is disabled.
- The image is drawn with its orientation applied (browser default `image-orientation: from-image`), because the canvas re-encode strips EXIF.
- A file that fails to load (e.g. missing on disk) is reported as failed.
- On success the page uses the same bookkeeping as Replace: it purges the list cache, records the thumbnail's cache-busting version and refetches the list.

### Bulk actions

- Each row gets a checkbox, plus a "select all on this page" toggle. Selection covers the **current page only** and is cleared when the page or tab changes.
- **Resize** or **Delete** can be applied to the selection after a single confirmation dialog. There is no bulk Replace.
- The frontend runs the single-photo actions **one at a time**, and a failure doesn't stop the job.
- At the end, a summary lists the photos that were resized / deleted, skipped (already small, GIF, not ready, replace in progress) or failed, each with a reason (including 409 / 422 conflicts).
- While a bulk job runs, the page shows progress and registers a `beforeunload` warning. If the tab is closed, photos already processed stay done and the rest are left untouched.
- The list is refetched once the job finishes.
- Every new string has a translation.

### Out of scope

- Server-side resize (a possible future follow-up in the proxy if browser-side bulk proves painful).
- Keeping the original file: resize overwrites it.
- Selecting across pages, or "all photos of this type".

## Solution

- **Resize helper** (pure, testable): load the photo `path` into an `Image`, compute the fitted size, draw it on a canvas and `toBlob` it with the original MIME type / quality. It returns either a `File` named like the original or a skip reason.
- **Upload**: send the resized `File` through the existing staff Replace flow (`POST /staff/photos/<photo_type>/<photo_id>/replace.json` → proxy upload → finalize), reusing the upload logic behind `PhotoUploadModal` without showing the modal.
- **Controller**: extend `StaffPhotosController` with `handleResize(photo)` and a sequential bulk runner shared by Resize and Delete. The runner collects per-photo outcomes (`done` / `skipped` / `failed` + reason, with errors mapped through `staffPhotoErrorKey`), drives the progress state and adds / removes the `beforeunload` listener.
- **UI**: row checkboxes and a select-all-on-page toggle, a bulk action bar (Resize / Delete), a Resize confirmation modal, a bulk confirmation modal, a progress indicator and a result summary.
- **i18n**: add the new keys to every language under `frontend/assets/i18n/`.

Owning agents: `frontend` (implementation and specs) and `translator` (translation keys).

## Benefits

- Staff can shrink oversized photos to the configured limit without any server-side image library.
- Bulk Resize / Delete makes photo cleanup practical, and the per-photo summary shows exactly what happened.
