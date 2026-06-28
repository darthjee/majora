# Frontend Plan: Frontend Photo Upload

Main plan: [plan.md](plan.md)

## Shared contracts

This agent consumes the following translation keys (added by the `translator` agent):
- `photo_upload_modal.title`
- `photo_upload_modal.submit`
- `photo_upload_modal.cancel`
- `photo_upload_modal.error`
- `game_edit_page.upload_photo_button`

This agent calls these two backend endpoints (already implemented):
- `POST /games/:slug/photo_upload.json` — body `{ filename }`, auth header `Authorization: Token ...`; responds `{ id, token }`
- `PATCH /uploads/:id/submit` — multipart with field `file`; header `X-Upload-Token: <token>`

## Implementation Steps

### Step 1 — Add `UploadClient`

Create `frontend/assets/js/client/UploadClient.js` extending `BaseClient`:

- `initUpload(gameSlug, filename, token)` — `POST /games/:gameSlug/photo_upload.json` with `Authorization: Token <token>` header and JSON body `{ filename }`. Returns the raw `Response`.
- `submitUpload(id, uploadToken, file)` — `PATCH /uploads/:id/submit` as multipart (`FormData` with field `file`), header `X-Upload-Token: <uploadToken>`. Returns the raw `Response`.

Add the corresponding spec at `frontend/specs/assets/js/client/UploadClientSpec.js`, following the `GameClientSpec` pattern (spy on `globalThis.fetch`, verify method, headers, and body for both methods).

### Step 2 — Add `PhotoUploadModalController`

Create `frontend/assets/js/components/elements/controllers/PhotoUploadModalController.js`:

Constructor injects `setError`, `setUploading`, `onSuccess`, and an optional `UploadClient` instance (default `new UploadClient()`).

- `handleSubmit(gameSlug, file, token)` — calls `initUpload`, then `submitUpload`; on success calls `onSuccess()`; on any non-ok response or thrown error calls `setError(true)`.
- `handleClear()` — resets `setError(false)` and `setUploading(false)`.

Add spec at `frontend/specs/assets/js/components/elements/controllers/PhotoUploadModalControllerSpec.js`.

### Step 3 — Add `PhotoUploadModalHelper`

Create `frontend/assets/js/components/elements/helpers/PhotoUploadModalHelper.jsx`:

Static `render(show, state, handlers)` method — mirrors `LoginModalHelper.render`. Returns a React Bootstrap `<Modal>` with:
- `<Modal.Header closeButton>` containing `Translator.t('photo_upload_modal.title')`
- `<Modal.Body>` containing:
  - Error alert (`alert-danger`) when `state.error` is true, showing `Translator.t('photo_upload_modal.error')`
  - A `<div>` drop zone with `onDragOver` / `onDrop` handlers and visible border (drag-and-drop target)
  - An `<input type="file">` picker
- `<Modal.Footer>` with Cancel (`btn-secondary`, `handlers.onCancel`) and Upload (`btn-primary`, `handlers.onSubmit`, disabled when `state.uploading`)

Add spec at `frontend/specs/assets/js/components/elements/helpers/PhotoUploadModalHelperSpec.js`.

### Step 4 — Add `PhotoUploadModal` component

Create `frontend/assets/js/components/elements/PhotoUploadModal.jsx`:

State: `file` (null), `error` (false), `uploading` (false).

Instantiate `PhotoUploadModalController` via `useMemo`. Wire handlers: `onClose` clears state then calls prop `onClose`; `onFileChange` / `onDrop` set `file`; `onSubmit` sets `uploading(true)`, calls `controller.handleSubmit(gameSlug, file, token)`.

Passes `show`, state, and handlers to `PhotoUploadModalHelper.render(...)`.

Add spec at `frontend/specs/assets/js/components/elements/PhotoUploadModalSpec.js`.

### Step 5 — Update `GameEdit` page

In `frontend/assets/js/components/pages/GameEdit.jsx`:

- Add `showUploadModal` boolean state (default `false`).
- Pass `gameSlug`, `showUploadModal`, `onOpenUploadModal` (`() => setShowUploadModal(true)`), and `onCloseUploadModal` (`() => setShowUploadModal(false)`) down to `GameEditHelper.render(...)`.
- Import and render `<PhotoUploadModal show={showUploadModal} gameSlug={gameSlug} onClose={onCloseUploadModal} onSuccess={onCloseUploadModal} />` (rendered unconditionally; Bootstrap Modal handles visibility via `show`).

### Step 6 — Update `GameEditHelper`

In `frontend/assets/js/components/pages/helpers/GameEditHelper.jsx`:

- Accept the extra `showUploadModal` / `onOpenUploadModal` / `onCloseUploadModal` via handlers parameter.
- Add an "Upload Photo" button (`btn-secondary`, `type="button"`, `onClick={handlers.onOpenUploadModal}`) next to the photo URL `<FormField>` label, using `Translator.t('game_edit_page.upload_photo_button')`.
- Pass `show`, `gameSlug`, `onClose`, `onSuccess` to `<PhotoUploadModal>` rendered inside the helper output.

Update the corresponding spec at `frontend/specs/assets/js/components/pages/helpers/GameEditHelperSpec.js` (if it exists; otherwise add it).

## Files to Change

- `frontend/assets/js/client/UploadClient.js` — new file; two-method upload client
- `frontend/specs/assets/js/client/UploadClientSpec.js` — new spec
- `frontend/assets/js/components/elements/controllers/PhotoUploadModalController.js` — new file
- `frontend/specs/assets/js/components/elements/controllers/PhotoUploadModalControllerSpec.js` — new spec
- `frontend/assets/js/components/elements/helpers/PhotoUploadModalHelper.jsx` — new file
- `frontend/specs/assets/js/components/elements/helpers/PhotoUploadModalHelperSpec.js` — new spec
- `frontend/assets/js/components/elements/PhotoUploadModal.jsx` — new file
- `frontend/specs/assets/js/components/elements/PhotoUploadModalSpec.js` — new spec
- `frontend/assets/js/components/pages/GameEdit.jsx` — add `showUploadModal` state + modal rendering
- `frontend/assets/js/components/pages/helpers/GameEditHelper.jsx` — add "Upload Photo" button + render modal

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- The `submitUpload` call must use `FormData` (multipart) — do **not** set `Content-Type` manually, as the browser must compute the boundary.
- The drag-and-drop drop zone should call `event.preventDefault()` on `onDragOver` to allow the drop.
- On modal close (cancel or success), always reset `file`, `error`, and `uploading` so the modal is clean on re-open.
- The `token` for `initUpload` comes from `AuthStorage.getToken()` inside the component or is injected from a parent prop — check how other pages (e.g. `GameEdit`) read the auth token and follow the same pattern.
- Do not replace the existing photo URL field — the button and modal are additive.
