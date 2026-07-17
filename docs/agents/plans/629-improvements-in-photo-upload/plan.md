# Plan: Improvements in photo upload

Issue: [629-improvements-in-photo-upload.md](../../issues/629-improvements-in-photo-upload.md)

## Overview
Give the shared photo upload flow (`UploadClient` + `PhotoUploadModalController`, reused by games, treasures, PCs, and NPCs) a longer, upload-specific request timeout, and make the submit button re-enable on success as well as on error, without changing the modal's existing close-on-success behavior.

## Context
- All photo upload UI goes through one shared implementation: `PhotoUploadModal` / `PhotoUploadModalController` / `UploadClient`. No per-entity duplication exists — only the `uploadPath` differs per caller (games, treasures, characters/NPCs).
- `BaseClient.request()` (`frontend/assets/js/client/BaseClient.js:35`) applies `AbortSignal.timeout(DEFAULT_TIMEOUT_MS)` (5000ms, line 7) whenever the caller doesn't pass its own `signal`. This default is shared by every request type (GET/POST/PATCH/etc.), not just uploads.
- `UploadClient.initUpload`/`submitUpload` (`frontend/assets/js/client/UploadClient.js`) currently don't pass a `signal`, so they inherit the 5s default — too short for larger files or slow connections.
- `PhotoUploadModalController.handleSubmit` (`frontend/assets/js/components/common/controllers/PhotoUploadModalController.js:33`) already calls `this.setUploading(false)` on both the non-ok-response branches and the `catch` block, re-enabling the button on error. On the success path (line 52, `this.onSuccess()`), `setUploading(false)` is never called — every current caller happens to close the modal in its own `onSuccess`, which masks the gap, but the controller itself would leave the button stuck disabled if the modal were ever kept mounted after success.
- Per discussion, the 20s timeout must be scoped to upload requests only (not a change to `BaseClient.DEFAULT_TIMEOUT_MS`), and the modal should keep closing on success as it does today — the success fix is a defensive correctness change, not a UX change to keep the modal open.

## Implementation Steps

### Step 1 — Scope a 20s timeout to upload requests
In `frontend/assets/js/client/UploadClient.js`, pass an explicit `signal: AbortSignal.timeout(20000)` in the `options` object of both `initUpload`'s and `submitUpload`'s `this.request(...)` calls. This overrides `BaseClient`'s default 5s timeout (`signal !== undefined` branch at `BaseClient.js:51`) for these two calls only; every other client/request keeps using the 5s default.

Consider extracting the `20000` literal to a small local constant (e.g. `UPLOAD_TIMEOUT_MS`) at the top of `UploadClient.js` for readability, mirroring `BaseClient`'s `DEFAULT_TIMEOUT_MS` pattern.

### Step 2 — Re-enable the submit button on success
In `frontend/assets/js/components/common/controllers/PhotoUploadModalController.js`, add `this.setUploading(false)` on the success path of `handleSubmit`, immediately before (or alongside) the existing `this.onSuccess()` call at line 52 — mirroring the pattern already used in the error branches. Do not change what `onSuccess()` itself does; the modal still closes today because every caller's `onSuccess` callback closes it, and that stays as-is.

### Step 3 — Update/add specs
- `frontend/specs/assets/js/client/UploadClient/initUploadSpec.js` and `.../submitUploadSpec.js`: assert that the `signal` passed to `fetch` is an `AbortSignal` distinct from `BaseClient`'s default (e.g. assert `options.signal instanceof AbortSignal` and, if feasible, that it was constructed with the 20s timeout rather than relying on internal timer inspection — follow the existing assertion style in `BaseClient/signalOptionSpec.js`).
- `frontend/specs/assets/js/components/common/controllers/PhotoUploadModalController/handleSubmitSpec.js`: add/extend a success-path test asserting `setUploading` is called with `false` after a successful `initUpload`+`submitUpload`, in addition to the existing assertion that `onSuccess` is called.

## Files to Change
- `frontend/assets/js/client/UploadClient.js` — pass a 20s `AbortSignal.timeout(...)` explicitly in `initUpload` and `submitUpload`.
- `frontend/assets/js/components/common/controllers/PhotoUploadModalController.js` — call `setUploading(false)` on the success path of `handleSubmit`.
- `frontend/specs/assets/js/client/UploadClient/initUploadSpec.js` — cover the new signal/timeout behavior.
- `frontend/specs/assets/js/client/UploadClient/submitUploadSpec.js` — cover the new signal/timeout behavior.
- `frontend/specs/assets/js/components/common/controllers/PhotoUploadModalController/handleSubmitSpec.js` — cover `setUploading(false)` on success.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes
- No backend, proxy, or infra changes are required — this is entirely a frontend fix confined to the shared upload client/controller.
- `ResilientRequest`-based retry does not apply here: `retry` defaults to `false` for non-GET methods, and both `initUpload`/`submitUpload` are POST, so a timeout still fails the attempt outright (now after 20s instead of 5s) rather than retrying — consistent with existing behavior, not something this issue changes.
