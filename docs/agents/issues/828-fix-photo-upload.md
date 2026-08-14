# Issue: Fix Photo upload

## Description
Photo/file uploads fail on several entity creation pages, during the upload's submit step.

## Problem
The frontend sends a submit request to `/uploads/undefined/:id/submit` instead of `/uploads/image/:id/submit` (or `/uploads/file/:id/submit`).

**Root cause:** `PhotoUploadSaga#upload` (`frontend/assets/js/components/common/base/controllers/PhotoUploadSaga.js`) destructures only `upload_id` and `token` from the `initUpload` response, and calls `UploadClient#submitUpload` without the `uploadType` argument:

```js
const { upload_id: uploadId, token: uploadToken } = await initResponse.json();
const submitResponse = await this.uploadClient.submitUpload(uploadId, uploadToken, photoFile);
```

`UploadClient#submitUpload` builds the request URL as `` `/uploads/${uploadType}/${id}/submit` ``, so with `uploadType` undefined the URL becomes `/uploads/undefined/:id/submit`.

For comparison, `PhotoUploadModalController#handleSubmit` (the other upload code path) does this correctly — it destructures `upload_type` from the init response and passes it through to `submitUpload`. So the bug is isolated to the `PhotoUploadSaga` code path, not the whole upload system.

Note: the existing spec (`PhotoUploadSagaSpec.js`) currently asserts the buggy call (`submitUpload` called without a 4th argument), so it codifies the bug rather than catching it — this needs updating as part of the fix.

**Scope:** any page whose controller composes `PhotoUploadSaga` for its "create-then-upload-photo" flow is affected — the bug lives in `PhotoUploadSaga#upload` itself, not in any individual page. As of now that includes (but isn't necessarily limited to, since new controllers may adopt the saga later):

- `CollectionNewController` — `/#/miniatures/collections/new`
- `SourceNewController` — `/#/miniatures/sources/new`
- `StlModelNewController` — `/#/miniatures/stl_models/new`
- `FactionNewController` — `/#/games/:game_slug/factions/new`
- `GameDocumentNewController` — `/#/games/:game_slug/documents/new`
- `GamePossessionNewController` — `/#/games/:game_slug/possessions/new`
- `CharacterPossessionNewController`
- `CharacterItemNewController`
- `GameNpcNewController`
- `GameItemNewController`

## Expected Behavior
Photo/file uploads succeed on every page listed above: the submit request is sent to the correctly-typed URL (`/uploads/image/:id/submit` or `/uploads/file/:id/submit`), matching the `upload_type` returned by the init step.

## Solution
Rather than a minimal patch to `PhotoUploadSaga` alone, extract the shared init→submit round trip into a new method on `UploadClient` itself, since `PhotoUploadModalController#handleSubmit` (including its chained second `#submitPhotoUpload` cycle) implements the same init-then-submit sequence independently — this class of bug (forgetting to thread `uploadType` through) can otherwise recur at any call site.

Add e.g. `UploadClient#runUploadCycle(initPath, file, token, name)`:
- Calls `initUpload`, and if not ok, returns `{ ok: false }`.
- Parses the init response body, calls `submitUpload` with the `upload_type` taken from that body (never left to the caller to thread through), and returns `{ ok: submitResponse.ok, ...initData }` (so callers can still access `upload_id`, `token`, `upload_type`, and any other init fields such as the newly created file's own `id`).

Callers become thin:
- `PhotoUploadSaga#upload` becomes `const { ok } = await this.uploadClient.runUploadCycle(uploadPath, photoFile, token); return ok;`.
- `PhotoUploadModalController#handleSubmit` uses `runUploadCycle` for both its first cycle and the chained `#submitPhotoUpload` cycle, deriving `fileId`/error state from the returned data instead of manually destructuring each init response.

This keeps `UploadClient` as the single source of truth for the upload protocol, removes the duplicated init+submit orchestration from both callers, and makes the "forgot to pass `uploadType`" bug structurally impossible at either call site.

**Edge cases:**
- Exceptions propagate, they aren't swallowed inside `runUploadCycle`. It stays a thin, exception-transparent wrapper around `initUpload`/`submitUpload` (including JSON-parse failures and the existing `AbortSignal.timeout`s). Callers keep their own `try`/`catch` exactly as today — `PhotoUploadSaga#upload` turns a thrown error into `false`, `PhotoUploadModalController#handleSubmit`/`#submitPhotoUpload` turn it into their respective error state.
- The two-error-state distinction in `PhotoUploadModalController` (`setError(true)` for the first cycle vs. `setError('photo')` for the chained second cycle) stays the caller's responsibility. `runUploadCycle` only ever returns `{ ok, ...initData }` — it has no notion of "first" vs "photo" cycle.

**Testing strategy:**
- New spec: `frontend/specs/assets/js/client/UploadClient/runUploadCycleSpec.js` (following the project's one-file-per-method convention already used for `initUploadSpec.js`/`submitUploadSpec.js`), covering:
  - `initUpload` not ok → short-circuits to `{ ok: false }` without calling `submitUpload`.
  - `initUpload` ok → calls `submitUpload` with the `upload_type` taken from the init response body (this is the assertion that directly catches the original bug).
  - `submitUpload` ok/not-ok → resolves to `{ ok, ...initData }` accordingly.
  - A thrown error (network failure, `AbortSignal.timeout`, malformed JSON) propagates rather than being swallowed.
- Update `PhotoUploadSagaSpec.js` to mock `runUploadCycle` directly instead of `initUpload`/`submitUpload` separately — this removes the existing assertion that encodes the bug and replaces it with an assertion against `runUploadCycle`'s arguments/return value.
- Update `PhotoUploadModalController`'s `handleSubmitSpec.js` the same way: mock `runUploadCycle` for both the first and chained second (`photoUpload`) cycles, and verify `setError(true)` vs `setError('photo')` are each still set from the correct cycle's failure.
- `submitUploadSpec.js` (already covers URL building from `uploadType`) needs no changes — `submitUpload`'s own contract is untouched, only its callers change.

## Benefits
Fixes photo/file uploads across all 10 currently affected entity-creation pages with a single change, removes duplicated init+submit orchestration between `PhotoUploadSaga` and `PhotoUploadModalController`, and makes the "forgot to pass `uploadType`" bug structurally impossible at either call site going forward.
