# Photo wrappers

Add a shared module, following the `summaryPath.js` pattern (shared variant constants + a
function taking the wrapper):

- Variant constants: `photoUpload: { regular: ':id/photo_upload', restricted: null }`,
  `photoSet: { regular: ':id/photos/:photoId/set', restricted: null }`,
  `photoDelete: { regular: ':id/photos/:photoId', restricted: null }`. `pathFor` only replaces
  `:id`; either extend it with a generic placeholder map or append the encoded photo id in the
  helper (encode with `encodeSegment`, blank → `UsageError`).
- `uploadPhoto(resource, id, file, options)`:
  1. Validate `file` before any request: a `Blob` (incl. `File`) is used as is; a `Buffer` /
     `Uint8Array` requires `options.filename` and becomes `new Blob([file], { type: contentType })`;
     anything else → `UsageError`. A `Blob` without a name uses `options.filename` when given.
  2. `POST pathFor('photoUpload', { id })` with no body → `{ upload_id, token }`.
  3. Build `FormData` with `file`, then `POST uploads/image/<upload_id>` + `/submit` with
     `json: false`, header `X-Upload-Token`, timeout `options.timeout ?? 120000`
     (export the default as a named constant), and pass `signal` / extra headers through.
  4. Return the submit body (`{ file_path }`).
  The init step uses the configured timeout (not the submit default).
- `setMainPhoto(resource, id, photoId, options)` → `PATCH`, no body, returns the body.
- `deletePhoto(resource, id, photoId, options)` → `DELETE`, returns the body.

Wire them:

- `CharacterResource`: variants `photoUpload`, `photoSet`, `photoDelete`; methods `uploadPhoto`,
  `setMainPhoto`, `deletePhoto` (so `Pcs` and `Npcs` get them).
- `Documents`: `photoUpload`, `photoSet`; `uploadPhoto`, `setMainPhoto`.
- `Factions`, `Items`: `photoUpload`; `uploadPhoto`.

Update each class JSDoc (actions list + `@example`).

Specs (with `specs/support/` `FetchStub`; add a shared `photoExamples.js` like
`summaryExamples.js`, run for each family): URLs of both steps, `X-Upload-Token` header,
multipart body with field `file` and the filename, the 120 s default and its override, the init
using the configured timeout, `{ restricted: true }` and unsupported actions throwing
`UsageError` before any request, invalid `file` / missing `filename` throwing `UsageError`
before any request, a proxy 422 surfacing `codes`, a failed init never sending the submit, no
retry on either `POST`, and neither token appearing in error messages.

## Files to Change

- `client/src/resources/photoPath.js` (new) — shared variants and helpers.
- `client/src/resources/CharacterResource.js` — upload/set/delete.
- `client/src/resources/Documents.js` — upload/set.
- `client/src/resources/Factions.js`, `client/src/resources/Items.js` — upload.
- `client/src/resources/Resource.js` — only if `pathFor` gains a generic placeholder map.
- `client/specs/support/photoExamples.js` (new), `client/specs/resources/*_spec.js` — coverage.
