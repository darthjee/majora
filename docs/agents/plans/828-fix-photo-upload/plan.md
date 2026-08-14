# Plan: Fix Photo upload

Issue: [828-fix-photo-upload.md](../../issues/828-fix-photo-upload.md)

## Overview

Photo/file uploads currently fail on 10 entity-creation pages because `PhotoUploadSaga#upload` never passes the `uploadType` returned by the init step through to `UploadClient#submitUpload`, producing a request to `/uploads/undefined/:id/submit`. Rather than a narrow patch to `PhotoUploadSaga` alone, this plan extracts the shared init→submit round trip into a new `UploadClient#runUploadCycle` method that both `PhotoUploadSaga` and `PhotoUploadModalController` compose, so `uploadType` is always sourced internally and this bug class becomes structurally impossible at either call site.

## Context

- `UploadClient#submitUpload` (`frontend/assets/js/client/UploadClient.js`) builds its request URL as `` `/uploads/${uploadType}/${id}/submit` ``.
- `PhotoUploadSaga#upload` (`frontend/assets/js/components/common/base/controllers/PhotoUploadSaga.js`) destructures only `upload_id`/`token` from the `initUpload` response and calls `submitUpload` with no 4th argument, so `uploadType` is `undefined`.
- `PhotoUploadModalController#handleSubmit`/`#submitPhotoUpload` (`frontend/assets/js/components/common/modals/controllers/PhotoUploadModalController.js`) already does this correctly today, destructuring `upload_type` and passing it through — it's the reference for correct behavior, and also a second, independent implementation of the same init+submit sequence that should be de-duplicated onto the new shared method.
- `PhotoUploadSaga` is composed by 10 controllers' create-then-upload flows: `CollectionNewController`, `SourceNewController`, `StlModelNewController`, `FactionNewController`, `GameDocumentNewController`, `GamePossessionNewController`, `CharacterPossessionNewController`, `CharacterItemNewController`, `GameNpcNewController`, `GameItemNewController`. None of these controllers need to change directly — the fix is entirely inside `UploadClient`, `PhotoUploadSaga`, and `PhotoUploadModalController`.
- The existing `PhotoUploadSagaSpec.js` currently asserts `submitUpload` is called with no 4th argument, i.e. it codifies today's bug rather than catching it.

## Implementation Steps

### Step 1 — Add `UploadClient#runUploadCycle`

In `frontend/assets/js/client/UploadClient.js`, add a new method `runUploadCycle(initPath, file, token, name)`:
- Calls `this.initUpload(initPath, file.name, token, name)`.
- If the init response is not `ok`, returns `{ ok: false }` without calling `submitUpload`.
- Otherwise parses the init response body, calls `this.submitUpload(uploadId, uploadToken, file, uploadType)` using the `upload_type` taken from that body, and returns `{ ok: submitResponse.ok, ...initData }` (spreading the full init body so callers can still read `upload_id`, `token`, `upload_type`, and any other fields such as the newly created file's own `id`).
- Does not catch exceptions itself (network errors, `AbortSignal.timeout` firing, malformed JSON) — it stays a thin, exception-transparent wrapper; callers keep handling errors via their own `try`/`catch`, as they do today.

### Step 2 — Update `PhotoUploadSaga#upload` to use `runUploadCycle`

In `frontend/assets/js/components/common/base/controllers/PhotoUploadSaga.js`, replace the manual `initUpload` + destructure + `submitUpload` sequence with a single `runUploadCycle` call, returning its `ok` field. Keep the existing `try`/`catch` around it, returning `false` on a thrown error.

### Step 3 — Update `PhotoUploadModalController` to use `runUploadCycle`

In `frontend/assets/js/components/common/modals/controllers/PhotoUploadModalController.js`, replace both manual init+submit sequences — the first cycle in `handleSubmit` and the chained second cycle in `#submitPhotoUpload` — with calls to `runUploadCycle`. Each call site keeps deciding its own error state from the result exactly as today: `handleSubmit`'s first cycle calls `setError(true)` on failure, `#submitPhotoUpload`'s cycle calls `setError('photo')`. Derive `fileId` (needed to build the second cycle's path) from the first `runUploadCycle` call's returned data instead of manually destructuring the init response.

### Step 4 — Update and add specs

- Rewrite `frontend/specs/assets/js/components/common/base/controllers/PhotoUploadSagaSpec.js` to mock `uploadClient.runUploadCycle` directly instead of `initUpload`/`submitUpload` separately, and assert against `runUploadCycle`'s arguments/return value — this removes the assertion that currently encodes the bug.
- Update `frontend/specs/assets/js/components/common/modals/controllers/PhotoUploadModalController/handleSubmitSpec.js` the same way: mock `runUploadCycle` for both the first and chained second (`photoUpload`) cycles, and verify `setError(true)` vs `setError('photo')` are each still set from the correct cycle's failure.
- Add a new spec `frontend/specs/assets/js/client/UploadClient/runUploadCycleSpec.js` (following the existing one-file-per-method convention seen in `initUploadSpec.js`/`submitUploadSpec.js`), covering:
  - `initUpload` not ok → short-circuits to `{ ok: false }` without calling `submitUpload`.
  - `initUpload` ok → calls `submitUpload` with the `upload_type` taken from the init response body (the assertion that directly catches the original bug).
  - `submitUpload` ok/not-ok → resolves to `{ ok, ...initData }` accordingly.
  - A thrown error (network failure, `AbortSignal.timeout`, malformed JSON) propagates out of `runUploadCycle` rather than being swallowed.
- `frontend/specs/assets/js/client/UploadClient/submitUploadSpec.js` needs no changes — `submitUpload`'s own contract (including URL building from `uploadType`) is untouched, only its callers change.

## Files to Change

- `frontend/assets/js/client/UploadClient.js` — add `runUploadCycle(initPath, file, token, name)`.
- `frontend/assets/js/components/common/base/controllers/PhotoUploadSaga.js` — use `runUploadCycle` in `upload()`.
- `frontend/assets/js/components/common/modals/controllers/PhotoUploadModalController.js` — use `runUploadCycle` in `handleSubmit()` and `#submitPhotoUpload()`.
- `frontend/specs/assets/js/components/common/base/controllers/PhotoUploadSagaSpec.js` — mock `runUploadCycle` instead of `initUpload`/`submitUpload`; drop the assertion that encodes the bug.
- `frontend/specs/assets/js/components/common/modals/controllers/PhotoUploadModalController/handleSubmitSpec.js` — mock `runUploadCycle` for both cycles.
- `frontend/specs/assets/js/client/UploadClient/runUploadCycleSpec.js` — new spec file.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`)

## Notes

- No backend, proxy, or infra changes are required — the fix is entirely within the frontend upload client and its two callers.
- No new pages need to change; fixing `PhotoUploadSaga#upload` and `PhotoUploadModalController` fixes all 10 currently affected create-then-upload-photo pages at once, since they all compose `PhotoUploadSaga` without their own copy of the init+submit logic.
