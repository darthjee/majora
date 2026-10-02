# Resize helper

Create a pure, DOM-free, testable module that decides whether a photo needs resizing and, if so, produces the resized `File`.

`frontend/assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoResizer.js` (default export class with static methods, matching the helpers folder style):

- `skipReason(photo)` returns the skip key based on the row alone, or `null`. The checks run in this order:
  - `replace_in_progress` → `'skip_replace_in_progress'`;
  - empty `path` → `'skip_no_path'`;
  - `!ready` → `'skip_not_ready'`;
  - a `.gif` extension (case-insensitive, ignoring any query string) → `'skip_gif'`.
- `outputFormat(path)` maps the extension to `{ mime, quality }`:
  - `.jpg` / `.jpeg` → `image/jpeg`, 0.85;
  - `.webp` → `image/webp`, 0.85;
  - `.png` → `image/png`, no quality.
  - Any other extension → `null`, which is treated as a failure (`error_resize_encode_failed`).
- `fitDimensions(width, height, max)` returns `{ width, height }` scaled so the longest side is `max` (rounded, aspect ratio kept), or `null` when the image already fits (never upscale).
- `async resize(photo, maxDimension, { loadImage, createCanvas } = defaults)` returns one of:
  - `{ status: 'skipped', reason }`, from `skipReason`, or `'skip_already_small'` once the image has loaded and `fitDimensions` returned `null`;
  - `{ status: 'resized', file }`, where `file` is a `File` with the original basename and extension and the output MIME type;
  - `{ status: 'failed', reason: 'error_resize_load_failed' | 'error_resize_encode_failed' }`, when the image fails to load or `toBlob` yields `null` / throws.
- Default dependencies:
  - `loadImage(src)` creates an `Image`, resolves on `load` and rejects on `error`;
  - `createCanvas(w, h)` creates a `<canvas>`.
  - Drawing uses `drawImage(img, 0, 0, w, h)`. The browser applies EXIF orientation by default (`image-orientation: from-image`), and the natural size it reports is already oriented.
  - PNG keeps transparency (do not fill the background).

Reasons are bare key suffixes; the UI prefixes them with `staff_photos_page.`.

Specs cover every skip branch, the format mapping, the fit maths (landscape, portrait, square, exact limit, smaller), the load failure, the encode failure and the success path, all with stubbed `loadImage` / `createCanvas`.

## Files to Change

- `frontend/assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoResizer.js` — new.
- `frontend/specs/assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoResizerSpec.js` — new.
