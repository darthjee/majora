# Frontend Plan: Add documents photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts". This agent consumes the backend's new
`POST /games/:game_slug/documents/:id/photo_upload.json` endpoint (added to `documentConfig.js`'s
`POST.single`) and relies on `AccessStore.ensureGameAccess(gameSlug)` (already generic, no
backend change needed) for `canUploadPhoto` gating.

## Implementation Steps

### Step 1 — Extend `DocumentPhoto.jsx` with `Edit`/`New` variants

In `frontend/assets/js/components/resources/document/pages/elements/show/DocumentPhoto.jsx`,
add `DocumentPhotoEdit` and `DocumentPhotoNew`, copying `ItemPhoto.jsx`'s `ItemPhotoEdit`/
`ItemPhotoNew` shape exactly (`type="document"`, `canEdit` always true, `dimmed={hidden}`,
`onClick={handlers.onOpenUploadModal}`). Update the exported `DocumentPhoto` object to
`{ Show: DocumentPhotoShow, Edit: DocumentPhotoEdit, New: DocumentPhotoNew }`. Also update
`DocumentPhotoShow` itself to accept `canUploadPhoto`/`handlers` and wire
`canEdit={Boolean(canUploadPhoto)}`/`onClick={handlers.onOpenUploadModal}` instead of the current
hardcoded `canEdit={false}`/`Noop.noop` (mirroring `ItemPhotoShow` exactly).

### Step 2 — Update `documentShowType.js`

In `frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js`:
- `left`: change `{ Show: DocumentNameHeading }` to `{ Show: DocumentNameHeading, Edit:
  DocumentNameHeading }` (both modes show the read-only name heading — there's no name-editing
  form in this issue's edit page).
- `right`: change `{ Show: DescriptionBox, New: DocumentDescriptionField }` to `{ Show:
  DescriptionBox, Edit: DescriptionBox, New: DocumentDescriptionField }` (edit mode shows the
  same read-only description box as show mode, no editable field).
- Leave the `New: DocumentTitle`/`DocumentNameField`/`DocumentHiddenField`/`DocumentSubmitButton`
  entries untouched (creation form fields are unaffected).
- `DocumentPhoto` (already in `left`) now renders its new `Edit` variant automatically once
  Step 1 lands — no further change needed here for the photo slot itself.

### Step 3 — Add `documentConfig.js`'s `POST.single` entry

In `frontend/assets/js/utils/requests/config/documentConfig.js`, add (mirroring `itemConfig.js`'s
`photoUploadInit`):

```js
const documentPhotoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/photo_upload.json`,
  permission: null,
};
```

and add a `POST.single: { regular: documentPhotoUploadInit, private: documentPhotoUploadInit }`
entry to the exported config, alongside the existing `POST.gameCollection`.

### Step 4 — Wire the show page (`GameDocument.jsx` + controller)

`GameDocumentController.js`: add `setCanUploadPhoto` (constructor param, mirroring
`GameItemController`'s), and a `#loadCanUploadPhoto(gameSlug, safeSet)` private method copied
verbatim from `GameItemController`'s (`AccessStore.ensureGameAccess` →
`is_superuser || is_staff || is_dm || is_player`). Call it from the loading path alongside the
existing document fetch.

`GameDocument.jsx`: add `canUploadPhoto`/`showUploadModal` state, wire `PhotoUploadModal` exactly
as `GameItem.jsx` does — `uploadPath` from
`resourceConfig.get('POST', 'document', 'single').regular.path({ gameSlug, id: document?.id })`,
`handleUploadSuccess` purging `RequestStore.purge({ resource: 'document' })` then re-running
`controller.buildEffect()()`.

`DocumentDetailHelper.jsx`: extend `render()` to accept `canUploadPhoto`/`onUploadClick` (default
`false`/`Noop.noop`, mirroring `ItemDetailHelper.render`'s own defaults) and pass them through
`context={{ ...document, canUploadPhoto, handlers: { onOpenUploadModal: onUploadClick } }}`.

### Step 5 — Add the deferred photo picker to `GameDocumentNew.jsx` + controller

Mirror `GameItemNew.jsx`/`GameItemNewController.js` exactly:
- `GameDocumentNewController.js`: add a `PhotoUploadSaga` field (constructor param
  `uploadClient`), extend `submitForm`'s success branch to call a new `#uploadPhoto` when
  `formValues.photoFile` is set (using `RequestStore.resolvePath({ resource: 'document', method:
  'POST', quantityType: 'single', params: { gameSlug, id: <created id> } })` — note: **not**
  `kind: 'game'`, since `document`'s `POST.single` has no dual-family `kind` branching like
  `item`'s does), add `retryPhotoUpload(...)` mirroring `GameItemNewController`'s.
- `GameDocumentNew.jsx`: add `photoFile`/`showUploadModal`/`gameDocumentId` state, the
  `photoPreviewUrl` object-URL memo/cleanup effect, `handleRetryPhotoUpload`/
  `handleSkipPhotoUpload` (skip redirects to the documents list, same as item's — there's no
  document detail page to land on either), and the deferred `<PhotoUploadModal deferred ...>` +
  `<PhotoUploadModal show={showUploadModal} deferred ...>` pair, exactly as `GameItemNew.jsx`
  does.
- New `frontend/assets/js/components/resources/document/pages/elements/show/DocumentNewPhotoUploadFailedAlert.jsx`,
  copying `ItemNewPhotoUploadFailedAlert.jsx` verbatim with `item_new_page.*` →
  `document_new_page.*` translation keys (add those three keys — `photo_upload_failed`,
  `retry_photo_upload`, `skip_photo_upload` — to every locale file under
  `frontend/assets/i18n/`, copying the `item_new_page` locale strings' wording pattern).
- `GameDocumentNewHelper.jsx`: extend `render()`'s context/handlers pass-through so the failed-
  alert and `New`-mode photo picker wiring reaches `ShowPageLayout`, mirroring
  `GameItemNewHelper.jsx`.

### Step 6 — Add the new `/documents/:id/edit` route and page

Route registration:
- `frontend/assets/js/utils/routing/HashRouteResolver.js`: insert
  `['/games/:game_slug/documents/:id/edit', 'gameDocumentEdit']` **before** the existing
  `['/games/:game_slug/documents/:id', 'gameDocument']` entry (route-matching order matters —
  the more specific `/edit` suffix must be tried first, same ordering already used for
  `items/:id/edit` before `items/:id`).
- `frontend/assets/js/components/helpers/AppHelper.jsx`: import `GameDocumentEdit` and add
  `gameDocumentEdit: <GameDocumentEdit />` to the page map, alongside the existing
  `gameDocument`/`gameDocumentNew`/`gameDocuments` entries.

New files, all photo-upload-only (no name/description/hidden form — those still have no PATCH
endpoint, matching the issue's explicit scope):
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentEditController.js` —
  mirrors `GameDocumentController.js`'s load-by-id logic (reuse the same `RequestStore.ensure`
  single-document fetch; no separate `full.json` need, since there's nothing DM-only to reveal
  here beyond what the show page already fetches) plus `getParamsFromHash` for
  `/games/:game_slug/documents/:id/edit`.
- `frontend/assets/js/components/resources/document/pages/GameDocumentEdit.jsx` — mirrors
  `GameDocument.jsx`'s state/effect/`PhotoUploadModal` wiring exactly (same
  `canUploadPhoto`/`showUploadModal` state and `handleUploadSuccess`), rendering through a new
  `GameDocumentEditHelper.render(document, backHref, canUploadPhoto, onUploadClick)` that calls
  `ShowPageLayout` with `mode="edit"` and a `backHref` to the document's show page (`#/games/:game_slug/documents/:id`)
  — needed here (unlike `ItemEditHelper`, which has no `backHref`) since this page has no form
  submit to redirect away on completion, so the back button is the only way out.
- `frontend/assets/js/components/resources/document/pages/helpers/GameDocumentEditHelper.jsx` —
  new, per above.

Also add a small Edit-button affordance on the show page so `/documents/:id/edit` is reachable
from the UI (otherwise it would be a dead route): in `DocumentDetailHelper.render()`, add a
`pageActions` prop mirroring `ItemDetailHelper`'s (`ConditionalComponent` gated on `canEdit`,
reusing the same `canUploadPhoto` flag as the edit gate here since there's no separate general
"edit" permission for documents — `canEdit={canUploadPhoto}` is intentional, not a typo)
rendering an `EditButton` linking to `editHref`. `GameDocument.jsx` builds
`editHref = \`#/games/${gameSlug}/documents/${document?.id}/edit\`` and passes it through,
mirroring `GameItem.jsx`'s own `editHref` construction.

### Step 7 — Tests

Add/extend Jasmine specs under `frontend/specs/assets/js/components/resources/document/`
mirroring the equivalent `item/` spec files one-for-one: `DocumentPhotoSpec.js` (new
Edit/New variants), `GameDocumentSpec.js` (upload modal wiring), `GameDocumentControllerSpec.js`
(`canUploadPhoto` derivation), `GameDocumentNewSpec.js` + `GameDocumentNewControllerSpec.js`
(deferred upload/retry/skip), and new `GameDocumentEditSpec.js` +
`GameDocumentEditControllerSpec.js` + `GameDocumentEditHelperSpec.js`. Also extend
`documentConfigSpec.js`/`documentShowTypeSpec.js` and `HashRouteResolverSpec.js` (new route) and
`AppHelperSpec.js` (new page-map entry).

## Files to Change

- `frontend/assets/js/components/resources/document/pages/elements/show/DocumentPhoto.jsx`
- `frontend/assets/js/components/common/show_page/show_types/configs/documentShowType.js`
- `frontend/assets/js/utils/requests/config/documentConfig.js`
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentController.js`
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx`
- `frontend/assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx`
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentNewController.js`
- `frontend/assets/js/components/resources/document/pages/GameDocumentNew.jsx`
- `frontend/assets/js/components/resources/document/pages/elements/show/DocumentNewPhotoUploadFailedAlert.jsx` (new)
- `frontend/assets/js/components/resources/document/pages/helpers/GameDocumentNewHelper.jsx`
- `frontend/assets/js/utils/routing/HashRouteResolver.js`
- `frontend/assets/js/components/helpers/AppHelper.jsx`
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentEditController.js` (new)
- `frontend/assets/js/components/resources/document/pages/GameDocumentEdit.jsx` (new)
- `frontend/assets/js/components/resources/document/pages/helpers/GameDocumentEditHelper.jsx` (new)
- `frontend/assets/i18n/*.yml` (or equivalent) — add `document_new_page.photo_upload_failed` /
  `retry_photo_upload` / `skip_photo_upload` keys to every locale
- corresponding spec files under `frontend/specs/assets/js/...` per Step 7

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- Double-check the translator script that verifies i18n keys stay in sync across languages picks
  up the three new `document_new_page.*` keys — run it locally per `docs/agents/i18n.md` before
  considering this issue's frontend half done.
- The "Edit" button added to the show page in Step 6 is a scope call this plan makes (the issue
  only explicitly asked for the `/documents/:id/edit` route to exist and support photo upload,
  not for a specific way to reach it) — flag this to the user/reviewer if a simpler
  "no nav entry, direct-URL-only" approach is preferred instead.
