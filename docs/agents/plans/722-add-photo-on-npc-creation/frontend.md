# Frontend Plan: Add photo on NPC creation

Main plan: [plan.md](plan.md)

## Shared contracts

- Needs four new translation keys from the `translator` agent (see `translator.md`
  for exact copy): `photo_upload_modal.confirm`, `game_npc_new_page.photo_upload_failed`,
  `game_npc_new_page.retry_photo_upload`, `game_npc_new_page.skip_photo_upload`.
  Reference them via `Translator.t('<key>')`, do not hardcode English strings.
- No new backend/proxy endpoints — reuses `POST /games/:slug/npcs.json`,
  `POST /games/:slug/npcs/:id/photo_upload.json`, and `POST /uploads/:id/submit`
  exactly as they exist today.

## Implementation Steps

### Step 1 — Deferred mode on `PhotoUploadModal`

Files: `frontend/assets/js/components/common/modals/PhotoUploadModal.jsx`,
`controllers/PhotoUploadModalController.js`, `helpers/PhotoUploadModalHelper.jsx`.

- Add a new prop `deferred` (boolean, default `false`) and `onFileConfirmed`
  (called with the picked `File`) to `PhotoUploadModal`. Keep `uploadPath`
  optional when `deferred` is true (no request is made in that mode).
- In `PhotoUploadModal`'s `handleSubmit`: when `deferred` is true, skip
  `controller.handleSubmit(...)` entirely — instead call `onFileConfirmed(file)`,
  then close the modal the same way `handleClose` does (clear file/error state,
  call `onClose`). No `uploading` state is needed in this branch.
- In `PhotoUploadModalHelper.render`, the submit button label must read
  `Translator.t('photo_upload_modal.confirm')` when `deferred` is true, and keep
  today's `Translator.t('photo_upload_modal.submit')` otherwise — pass `deferred`
  down from `PhotoUploadModal` into the `handlers`/state object the helper already
  receives.
- `PhotoUploadModalController` itself needs no change — deferred mode bypasses it
  completely on the frontend, so `handleSubmit`/`handleClear` keep serving the
  existing (edit-page) immediate-upload mode unmodified.

### Step 2 — Photo picker on the NPC creation page

Files: `frontend/assets/js/components/resources/character/pages/GameNpcNew.jsx`,
`elements/CharacterAvatarField.jsx` (doc comment only — behavior is unchanged,
it already supports `canEdit`/`onClick`/`url`).

- In `GameNpcNew.jsx`, add local state: `photoFile` (the confirmed `File`, or
  `null`), `photoPreviewUrl` (derived via `URL.createObjectURL(photoFile)` in a
  `useMemo`/`useEffect` that revokes the previous object URL on change/unmount —
  mirrors how other parts of the app avoid leaking object URLs, check
  `grep -rn "createObjectURL"` for an existing convention to follow if one exists,
  otherwise use the standard revoke-on-cleanup pattern), and `showUploadModal`.
- Render `CharacterAvatarField` with `canEdit` (was hardcoded `false`) and
  `onClick={() => setShowUploadModal(true)}`, `url={photoPreviewUrl}` — same
  overlay button pattern already used on `CharacterDetail.jsx`.
- Render `PhotoUploadModal` with `deferred`, no `uploadPath` (not needed yet),
  `onFileConfirmed={(file) => { setPhotoFile(file); setShowUploadModal(false); }}`,
  `onClose={() => setShowUploadModal(false)}`.
- Update the doc comment atop `GameNpcNewHelper.render`/`CharacterAvatarField`
  that currently says avatar upload is deferred to after the entity exists via a
  static placeholder — the placeholder is now only the *default* (no photo
  picked yet), not a hard limitation.

### Step 3 — Two-step saga in `GameNpcNewController`

File: `frontend/assets/js/components/resources/character/pages/controllers/GameNpcNewController.js`.

- Inject a `UploadClient` instance (constructor param, defaulting to
  `new UploadClient()`, same pattern as the existing `characterClient` param) —
  reuse `UploadClient.initUpload`/`submitUpload` directly, the same two calls
  `PhotoUploadModalController.handleSubmit` makes, rather than depending on that
  controller class (it's scoped to the modal's own state setters).
- `submitForm` gains a `photoFile` argument (or reads it off `formValues`, whatever
  keeps `GameNpcNew.jsx`'s call site cleanest) and a new page status value used
  only when the photo step fails, e.g. `'photo-upload-failed'` (alongside the
  existing `'idle' | 'submitting' | 'error'`).
- On NPC creation success (`response.status === 201`): if `photoFile` is set, call
  a new private method, e.g. `#uploadPhoto(gameSlug, characterId, photoFile, token, setters)`,
  that runs `initUpload` then `submitUpload` against
  `/games/${gameSlug}/npcs/${characterId}/photo_upload.json`. On success, redirect
  exactly as today. On failure (non-ok response or thrown error), do **not**
  redirect — instead set status to `'photo-upload-failed'` and keep the character
  id and photoFile around (in controller state or via the setters) so a retry
  action can call `#uploadPhoto` again with the same arguments.
- If no `photoFile` was set, behavior is unchanged (redirect immediately on 201).
- The NPC-creation failure path (400/500 before the character exists) is
  unchanged — the user already stays on the form and can resubmit, including
  their already-picked photo, since `photoFile` lives in the page's own state and
  isn't cleared on that failure.

### Step 4 — Retry/skip UI

Files: `GameNpcNew.jsx`, `helpers/GameNpcNewHelper.jsx`.

- When `status === 'photo-upload-failed'`, render an alert
  (`Translator.t('game_npc_new_page.photo_upload_failed')`) with two buttons:
  "Retry photo upload" (`Translator.t('game_npc_new_page.retry_photo_upload')`),
  which re-invokes the same upload-only path from Step 3 (no new NPC-creation
  call), and "Skip and continue" (`Translator.t('game_npc_new_page.skip_photo_upload')`),
  which redirects to the NPC page immediately (`window.location.hash =
  '/games/${gameSlug}/npcs/${characterId}'`), same as a successful upload would.
- The main form's submit button should be hidden/disabled in this state (the NPC
  already exists — resubmitting the form must not create a second NPC).

### Step 5 — Tests

- `PhotoUploadModalSpec.js` / `PhotoUploadModalHelperSpec.js`: cover the new
  `deferred` prop — Confirm calls `onFileConfirmed` and closes without touching
  `PhotoUploadModalController`; button label switches to `photo_upload_modal.confirm`.
- `GameNpcNewControllerSpec` (under `specs/.../controllers/GameNpcNewController/`,
  mirror the existing per-method spec-file split there): cover the new saga —
  photo upload success after creation, photo upload failure leaving status
  `'photo-upload-failed'` and allowing retry, and the no-photo-selected path
  staying identical to current behavior.
- `GameNpcNewSpec.js` / `GameNpcNewHelperSpec.js`: cover the avatar becoming
  editable, the deferred modal wiring, and the retry/skip alert rendering.
- `CharacterAvatarFieldSpec.js`: no behavior change expected (props already
  support this), but confirm existing tests still pass with `canEdit={true}`
  actually exercised by the creation page now.

## CI Checks

Run from `frontend/`:
- `npm run coverage` — Jasmine specs + coverage (must stay green, matches
  `.circleci/config.yml`'s `frontend` test job).
- `npm run check_i18n` — verifies every locale defines the four new keys.
- `npm run lint` — ESLint.
