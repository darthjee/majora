# Plan: Enable buttons on error

Issue: [228-enable-buttons-on-error.md](../../issues/228-enable-buttons-on-error.md)

## Overview

Two frontend controllers leave their submit/upload button permanently disabled after a
failed request, because the relevant state setter is never invoked again on the error
path. Fix both controllers so the button-disabling state is reset on every failure
branch, following the pattern already used correctly by `GameEditController` and
`TreasureEditController`.

## Context

- `BaseCharacterEditController.submitForm` (shared by NPC and PC edit pages) sets
  `setters.setStatus('submitting')` before the request, but `handleSubmit` and the
  private `#handleResponse` never receive `setters`, so `setStatus` is never called
  again. On failure, the code currently calls `this.setError(...)` instead — the
  page-level error setter passed into the controller's constructor — which is the wrong
  setter for this purpose (it is reserved for load failures and replaces the whole page
  with `CharacterHelper.renderError`, per `frontend/assets/js/components/pages/shared/CharacterEdit.jsx`).
  The button is disabled via `disabled={state.status === 'submitting'}` in
  `BaseCharacterEditHelper.jsx`, and an inline error alert is already wired to
  `state.status === 'error'` in the same helper (translation keys
  `npc_edit_page.error` / `pc_edit_page.error` already exist), confirming
  `setters.setStatus('error')` is the intended mechanism.
- `PhotoUploadModalController.handleSubmit` receives `setUploading` in its constructor
  (called with `setUploading(true)` by the caller, `PhotoUploadModal.jsx`, before
  `handleSubmit` runs), but none of its three failure branches (`!initResponse.ok`,
  `!submitResponse.ok`, the `catch` block) call `this.setUploading(false)`. Only
  `handleClear()` resets it, which only runs when the modal is closed.
- The reference pattern is `GameEditController#submitForm`/`#handleResponse`
  (`frontend/assets/js/components/pages/controllers/GameEditController.js`): `setters`
  is threaded into both methods, and `setters.setStatus('error')` is called on the
  catch branch and on the non-400 branch of `#handleResponse`.

## Implementation Steps

### Step 1 — Thread `setters` through `BaseCharacterEditController`

In `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js`:

- Change `handleSubmit(gameSlug, characterId, fields)` to
  `handleSubmit(gameSlug, characterId, fields, setters)`, and update `submitForm` to
  pass `setters` through to `this.handleSubmit(...)`.
- In `handleSubmit`'s `catch` block, replace `this.setError('Unable to save character.')`
  with `setters.setStatus('error')`.
- Change `#handleResponse(response, gameSlug, characterId)` to
  `#handleResponse(response, gameSlug, characterId, setters)`, update the call site in
  `handleSubmit` accordingly, and replace the trailing
  `this.setError('Unable to save character.')` (non-400 failure branch) with
  `setters.setStatus('error')`. Keep the existing `setters.setFieldErrors(errors)` call
  for the 400 branch unchanged, and keep the `response.ok` redirect branch unchanged.
- Leave the `setError` constructor param and `this.setError` field in place — they are
  still used by the load controller for fetch failures; only the submit-error paths
  change.

### Step 2 — Reset `setUploading` on every failure branch in `PhotoUploadModalController`

In `frontend/assets/js/components/elements/controllers/PhotoUploadModalController.js`,
in `handleSubmit`:

- When `!initResponse.ok`, call `this.setUploading(false)` alongside the existing
  `this.setError(true)` before `return`.
- When `!submitResponse.ok`, call `this.setUploading(false)` alongside the existing
  `this.setError(true)` before `return`.
- In the `catch` block, call `this.setUploading(false)` alongside the existing
  `this.setError(true)`.

`handleClear()` is unaffected (still resets both flags when the modal closes).

### Step 3 — Update/extend specs

- `frontend/specs/assets/js/components/pages/controllers/BaseCharacterEditControllerSpec.js`:
  update existing `handleSubmit`/`submitForm` specs to pass a `setters` stub
  (`{ setStatus, setFieldErrors }`) and assert `setStatus` is called with `'error'` on
  both the network-error (catch) and non-400 server-error response paths, instead of
  asserting on the old `setError` page-level setter for those paths. Keep/adjust the
  existing 400 → `setFieldErrors` assertion and the success → redirect assertion.
- `frontend/specs/assets/js/components/elements/controllers/PhotoUploadModalControllerSpec.js`:
  add/extend specs asserting `setUploading(false)` is called for each of the three
  failure branches (init failure, submit failure, thrown error), in addition to the
  existing `setError(true)` assertions.

## Files to Change

- `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js` — thread `setters` into `handleSubmit`/`#handleResponse`; call `setters.setStatus('error')` on both failure paths instead of `this.setError(...)`.
- `frontend/assets/js/components/elements/controllers/PhotoUploadModalController.js` — call `this.setUploading(false)` on all three failure branches in `handleSubmit`.
- `frontend/specs/assets/js/components/pages/controllers/BaseCharacterEditControllerSpec.js` — update specs for the new `setters` threading and error-path assertions.
- `frontend/specs/assets/js/components/elements/controllers/PhotoUploadModalControllerSpec.js` — add specs asserting `setUploading(false)` on every failure branch.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`) — also runnable via `docker-compose run --rm majora_fe yarn lint`
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- No backend, infra, proxy, or translation changes are needed — the relevant
  translation keys (`npc_edit_page.error`, `pc_edit_page.error`) already exist.
- `CharacterEdit.jsx` and `PhotoUploadModal.jsx` (the React components) do not need
  changes — they already pass the right setters into their controllers; only the
  controllers fail to use them on the error paths.
