# Frontend Plan: Files should have a name and a Photo

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes the extended `POST /games/:game_slug/documents/:id/file_upload.json`
  request body: an optional `name` field alongside the existing `filename`.
  When left blank, the backend falls back to `filename` — so the frontend
  does not need to duplicate that fallback logic itself, just send `name`
  as typed (possibly empty).
- Needs a new translation key from the `translator` agent, under the
  existing `file_upload_modal` namespace (see `translator.md` for the exact
  key), for the name input's label/placeholder.

## Implementation Steps

### Step 1 — Add an opt-in name field to `PhotoUploadModal`

`frontend/assets/js/components/common/modals/PhotoUploadModal.jsx` is shared
between the photo-upload and file-upload variants (`translationPrefix`/
`accept` props already distinguish them, per issue #726). Add a new prop,
e.g. `showNameField` (default `false`), and local `name`/`setName` state.
Only pass `showNameField={true}` from the file-upload usage in
`frontend/assets/js/components/resources/document/pages/GameDocument.jsx`
(the `showFileUploadModal` modal instance) — the plain photo-upload modal
instance stays unaffected.

Reset `name` state alongside `file` in `handleClose`.

### Step 2 — Render the name input

`frontend/assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx`:
when `state.showNameField` is true, render a text `<input>` (labeled via the
new `Translator.t(`${translationPrefix}.name_label`)` key) above or below
the existing file `<input type="file">`, wired to a new
`handlers.onNameChange` handler. Leave it out entirely when
`showNameField` is false (photo-upload variant), so its DOM/snapshot is
unchanged.

### Step 3 — Thread `name` through submit

`PhotoUploadModal.jsx`'s `handleSubmit` passes `name` through to
`controller.handleSubmit(uploadPath, file, token, name)`.

`frontend/assets/js/components/common/modals/controllers/PhotoUploadModalController.js`'s
`handleSubmit` accepts the new `name` param and forwards it to
`this.client.initUpload(uploadPath, file.name, token, name)`.

`frontend/assets/js/client/UploadClient.js`'s `initUpload` accepts an
optional `name` param and includes it in the JSON body:
`JSON.stringify(name ? { filename, name } : { filename })` (or always
include `name: name ?? ''` — whichever keeps existing photo-upload callers,
which won't pass a `name` arg at all, sending exactly the same body as
today).

### Step 4 — Specs

Update/add specs for every file touched above:
- `frontend/specs/assets/js/components/common/modals/PhotoUploadModalSpec.js`
  — new cases for `showNameField` true/false, name state reset on close.
- `frontend/specs/assets/js/components/common/modals/helpers/PhotoUploadModalHelperSpec.js`
  — name input renders only when `showNameField` is true; calls
  `onNameChange` on input.
- `frontend/specs/assets/js/components/common/modals/controllers/PhotoUploadModalController/handleSubmitSpec.js`
  — `name` forwarded to `client.initUpload`; existing (no-`name`) calls from
  the photo-upload variant still pass unchanged.
- `frontend/specs/assets/js/components/resources/document/pages/GameDocumentFileUploadModalSpec.js`
  and `DocumentDetailHelperSpec.js` — confirm the file-upload modal instance
  passes `showNameField={true}` (and the photo-upload one doesn't, if such a
  spec exists for it).
- Add a `UploadClient` spec case (or extend the existing one) for
  `initUpload` with a `name` argument.

## Files to Change

- `frontend/assets/js/components/common/modals/PhotoUploadModal.jsx` — `showNameField` prop + `name` state
- `frontend/assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx` — render name input
- `frontend/assets/js/components/common/modals/controllers/PhotoUploadModalController.js` — thread `name` through
- `frontend/assets/js/client/UploadClient.js` — `initUpload` accepts/sends `name`
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — pass `showNameField={true}` to the file-upload modal instance
- `frontend/specs/assets/js/components/common/modals/PhotoUploadModalSpec.js` — extend
- `frontend/specs/assets/js/components/common/modals/helpers/PhotoUploadModalHelperSpec.js` — extend
- `frontend/specs/assets/js/components/common/modals/controllers/PhotoUploadModalController/handleSubmitSpec.js` — extend
- UploadClient spec — extend

## CI Checks

- `frontend/`: `npm run coverage` (CI job: `jasmine`)
- `frontend/`: `npm run lint` (CI job: `checks`)
- `frontend/`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until the `translator` agent's key lands in every locale file.

## Notes

- Keep the name input optional in the UI (no client-side "required" styling)
  — blank is a valid, meaningful input (falls back server-side to the
  filename), not an error state.
- Double-check `PhotoUploadModal`'s existing photo-upload callers (game
  cover photo, character profile photo, item/treasure photos, etc.) render
  and submit exactly as before — `showNameField` must default to `false`
  everywhere it isn't explicitly passed.
