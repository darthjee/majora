# Issue: Improvements in photo upload

## Description
Photo upload (used for games, treasures, PCs, and NPCs) shares a single implementation (`PhotoUploadModal`, `PhotoUploadModalController`, `UploadClient`). This issue covers reliability and UX improvements to that shared upload flow.

## Problem
- The upload request timeout is currently the shared client default of 5 seconds (`BaseClient.DEFAULT_TIMEOUT_MS`), which is too short and can cause uploads to fail on slower connections or with larger files. This default is shared by every API request made through `BaseClient`, not just uploads.
- On upload success, the submit button is never explicitly re-enabled (`setUploading(false)` is not called on the success path in `PhotoUploadModalController`). Today every caller happens to close the modal in its `onSuccess` callback, which masks this, but the controller itself leaves the button in a disabled state on success.

## Expected Behavior
- Photo upload requests (`initUpload`/`submitUpload` in `UploadClient`) use a 20-second timeout, without changing the 5-second default used by other API requests.
- On upload error, the submit button remains re-enabled so the user can retry (already the case today, must not regress).
- On upload success, `PhotoUploadModalController` explicitly re-enables the submit button (`setUploading(false)`) before/alongside calling `onSuccess()`. The modal still closes on success as it does today; this is a defensive correctness fix so the button is never left stuck disabled, independent of what a given caller's `onSuccess` does.

## Solution
- Pass a custom timeout (20s) via `AbortSignal.timeout(...)` when calling `this.request(...)` from `initUpload` and `submitUpload` in `UploadClient.js`, instead of relying on `BaseClient.DEFAULT_TIMEOUT_MS`.
- In `PhotoUploadModalController.handleSubmit`, call `this.setUploading(false)` on the success path (mirroring the existing error path) before invoking `this.onSuccess()`.
