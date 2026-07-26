# Frontend Plan: Add document file upload

Main plan: [plan.md](plan.md)

## Shared contracts

- Both `POST .../photo_upload.json` and the new `POST .../file_upload.json` return `upload_type` in their JSON response.
- Submit URL becomes `/uploads/${uploadType}/${id}/submit` (was `/uploads/${id}/submit`) — needs `uploadType` threaded from the init response through to `UploadClient.submitUpload`.
- New backend route: `POST /games/:game_slug/documents/:id/file_upload.json`.
- i18n keys for the new modal (translator will add the actual translations): `file_upload_modal.{cancel,confirm,error,submit,title}`, mirroring `photo_upload_modal`.

## Implementation Steps

### Step 1 — `UploadClient` accepts `uploadType`
In `frontend/assets/js/client/UploadClient.js`, change `submitUpload(id, uploadToken, file)` to `submitUpload(id, uploadToken, file, uploadType)`, building the URL as `` `/uploads/${uploadType}/${id}/submit` `` instead of `` `/uploads/${id}/submit` ``.

### Step 2 — `PhotoUploadModalController` threads `upload_type` through
In `frontend/assets/js/components/common/modals/controllers/PhotoUploadModalController.js`, capture `upload_type` from the `initUpload` response and pass it into `submitUpload`. Since this controller is shared, it should work unchanged for both photo and (new) file flows as long as the init response always includes `upload_type` (backend contract above) — no controller fork needed unless the modal UI itself needs to diverge (see Step 3).

### Step 3 — File upload modal
Reuse `PhotoUploadModal.jsx` + `PhotoUploadModalController.js` for files too, rather than forking a parallel component tree, by parametrizing:
- `frontend/assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx` — accept an i18n key-prefix prop (default `photo_upload_modal`) instead of hardcoding it, and an `accept` prop for the `<input type="file">` (e.g. `accept=".pdf"` for file mode, unset for images — note current code has no `accept` restriction at all today, so this is additive).
- `PhotoUploadModal.jsx` — accept and forward a `translationPrefix`/`accept` prop down to the helper (default values preserve current photo behavior unchanged).

If parametrizing turns out messier than expected once in the code, a thin `FileUploadModal.jsx` wrapper around the same controller/helper (passing the file-specific prefix/accept) is an acceptable fallback — prefer the parametrized version first since the components are already generic over `uploadPath`.

### Step 4 — Document page: file upload button + modal
In `frontend/assets/js/components/resources/document/pages/GameDocument.jsx`:
- Add a `showFileUploadModal` state, a button next to "back" (per the issue's UI section) that opens it.
- Gate the button the same way the existing photo-upload button/Edit button are gated: wrap it in `ConditionalComponent` keyed on the existing `canUploadPhoto` flag (`GameDocument.jsx:28`, computed in `GameDocumentController.js`'s `#canUploadPhoto`, which already ORs `is_superuser || is_staff || is_dm || is_player`). Do not introduce a new flag or backend serializer field for this — the role set required (dm, admin, player, staff) is identical to the existing photo-upload permission, and `canUploadPhoto` already covers exactly those four. If the name reads oddly for a non-photo action, it's fine to thread it through `DocumentDetailHelper.jsx` under its existing name unchanged (renaming it is out of scope — it would touch an unrelated, working code path for no functional gain).
- Compute a `fileUploadPath` via `resourceConfig.get('POST', 'document', 'file').regular.path({ gameSlug, id: document?.id })` (see Step 5 for the resourceConfig entry).
- Render the (now-parametrized) upload modal with `translationPrefix="file_upload_modal"` and `accept=".pdf"`.
- On success, mirror the existing `handleUploadSuccess` pattern: purge `RequestStore` for `resource: 'document'`, then refetch.

### Step 5 — `documentConfig.js` new resource path
In `frontend/assets/js/utils/requests/config/documentConfig.js`, add:
```javascript
const documentFileUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/file_upload.json`,
  permission: null,
};
```
and register it under `POST.single` alongside the existing photo entry — mirroring the existing convention of reusing `single` rather than introducing a new top-level resource (documents' file collection stays document-scoped, same as photos):
```javascript
POST: {
  gameCollection: { regular: gameDocumentCreate, private: gameDocumentCreate },
  single: { regular: documentPhotoUploadInit, private: documentPhotoUploadInit },
  file: { regular: documentFileUploadInit, private: documentFileUploadInit },
},
```

### Step 6 — Tests
Add/extend Jasmine specs alongside the existing ones for `PhotoUploadModal`, `PhotoUploadModalController`, `UploadClient`, and `GameDocument` page — covering: `uploadType` threading through submit, the new button/modal open/close, `.pdf`-only `accept` on the file variant, and the new `documentConfig` path entry.

## Files to Change
- `frontend/assets/js/client/UploadClient.js` — `submitUpload` gains `uploadType` param.
- `frontend/assets/js/components/common/modals/controllers/PhotoUploadModalController.js` — thread `upload_type` from init response to submit.
- `frontend/assets/js/components/common/modals/PhotoUploadModal.jsx` — accept `translationPrefix`/`accept` props.
- `frontend/assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx` — use i18n key-prefix prop, forward `accept`.
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — new button/modal wiring.
- `frontend/assets/js/utils/requests/config/documentConfig.js` — new `file` upload-init path entry.
- Corresponding `*.spec.js`/`*.spec.jsx` files for each of the above.

## CI Checks
- `frontend`: `npm test` / jasmine (CI job `jasmine`), `npm run lint` (CI job `frontend-checks`), per `.circleci/config.yml`.

## Notes
- This depends on the backend's `upload_type` route/response contract (see [plan.md](plan.md) "Shared contracts") — coordinate deploy timing; the old `/uploads/:id/submit` URL stops working once backend/proxy switch over, so frontend's `UploadClient` change must ship in the same release.
- Only one frontend file references the raw submit path today (`UploadClient.js`), so the blast radius of the URL change is small.
