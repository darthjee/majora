# Upload

The `Upload` model tracks the lifecycle of a photo/file upload (pending → uploading → uploaded),
generically for a `GamePhoto`, `CharacterPhoto`, `GameItemPhoto`, `CharacterItemPhoto`,
`GameDocumentPhoto`, `GameDocumentFile`, `GameDocumentFilePhoto`, `TreasurePhoto`, or
`StlModelPhoto`.

An `upload_type` field (`'image'` or `'file'`, default `'image'`) records which validation/storage
strategy the proxy applied — not itself an access-control gate (the per-endpoint permission
classes below still apply identically regardless of `upload_type`), but a defense-in-depth check
that the URL's `upload_type` segment matches the row's stored value.

| Action | Who can |
|--------|---------|
| Create (`POST /games/<slug>/photo_upload.json`) | **GameEdit** |
| Create (`POST /games/<slug>/pcs/<id>/photo_upload.json`) | **CharacterPhotoUpload** |
| Create (`POST /games/<slug>/npcs/<id>/photo_upload.json`) | **NpcPlayerEdit** |
| Create (`POST /games/<slug>/documents/<id>/photo_upload.json`, `.../file_upload.json`, `.../files/<file_id>/photo_upload.json`) | Staff, any player of the game, or the game's dm/editor — see [GameDocument](game-document.md) |
| Create (`POST /treasures/<id>/photo_upload.json`) | Superuser always; additionally the treasure's owning game's GameMaster, when exclusive to a game |
| Create (`POST /miniatures/stl_models/<id>/photo_upload.json`) | **Staff-or-superuser** (`require_staff`) — see [StlModel](stl-model.md) |
| Create (`POST /staff/photos/<photo_type>/<photo_id>/replace.json`) | **Staff-or-superuser** (`require_staff`) — see [Staff Photos](staff-photo.md) |
| Read | Only the user who initiated the upload (indirectly, via the 201 response at creation time). Copy-origin exceptions (**Staff-or-superuser**): renew returns a fresh `token` to the renewing staff member, `GET /staff/copies/links.json` lists `status`/`error` (no paths, no token), and `PATCH ... status=uploading` returns `source_path` next to `file_path` — see [Copy-origin uploads](#copy-origin-uploads) |
| Update / Delete | No public endpoint; status transitions are handled internally |

## Fields

- `id` (int), `token` (secret string), `upload_type` — returned in the `201` response to the
  authenticated initiator only. `token` must never be exposed to any user other than the one who
  created the upload, nor through any endpoint other than the init response.
- `id` also identifies the created/reused photo/file record itself (distinct from the `Upload`
  row's own `upload_id`) — not confidentiality-sensitive (already exposed elsewhere once
  `ready=True`), included so a caller can chain a second, dependent upload before the first
  finalises (e.g. [GameDocument](game-document.md)'s file→photo chain).
- All other fields (`file_path`, `expiration_time`, `status`, `user`, `content_type`,
  `object_id`, `origin`, `source_path`, `is_cover`, `error`) are internal, never returned by any
  endpoint — except for the copy-origin exceptions below.
- `origin` (`regular` default / `staff` / `copy`) records which flow created the upload: every
  per-entity init endpoint creates `regular` uploads; only the staff replace endpoint creates
  `staff` ones; only the staff copy endpoints create `copy` ones (hard-link jobs). It selects the
  finalize branch (see [Staff-origin uploads](#staff-origin-uploads) and
  [Copy-origin uploads](#copy-origin-uploads)).
- `status` is `pending`, `uploading`, `uploaded` or `failed`. `failed` is reachable only by
  copy-origin uploads.
- `source_path` (nullable) — the source row's path a copy upload hard-links from; null for
  non-copy uploads. Generated server-side, never accepted from a request.
- `is_cover` (boolean, default false) — the copied source row was its owner's cover `photo`.
- `error` (nullable) — why a copy link failed: `source_missing`, `path_rejected`,
  `cross_device`, `target_exists`, `permission` or `unknown`.
- **Copy-origin exceptions** (see [Staff Copy](staff-copy.md#exceptions-to-upload)): renew
  returns a fresh `token` to the renewing staff member (the only endpoint besides init that
  returns a token); `GET /staff/copies/links.json` exposes `status` and `error`;
  `PATCH ... status=uploading` returns `source_path` next to `file_path`.

## Route shape and the no-leak ordering guarantee

Submit (`POST /uploads/<upload_type>/<id>/submit.json`, proxy-facing) and finalize (`PATCH
/uploads/<upload_type>/<id>.json`, backend-facing) both carry `upload_type` as a URL segment
(`image`/`file` only — an unrecognized value 404s before the view runs). The finalize view runs
the token/ownership/expiry/status checks first (uniform `403` on any failure) and only *after*
those pass does it check whether the URL's `upload_type` matches the row's stored value (`404` if
not). This ordering is deliberate: the `404` must never be observable by a caller who hasn't
already proven ownership via a valid `X-Upload-Token` — otherwise a caller could distinguish
"doesn't exist" (403) from "exists, wrong type" (404) from "exists, right type, not authorized"
(403), leaking the existence and `upload_type` of an arbitrary upload it has no claim to.

Finalize is decorated with `@restricted`, so every one of its responses (any status, regular or
staff origin) carries `X-Skip-Cache: true`.

## Side effect on finalisation

`PATCH /uploads/<upload_type>/<id>.json` with `status=uploaded` marks the linked record
`ready=True` and, if its owner does not already have a primary photo, sets that primary photo
reference. Dispatches on `content_object` type:

- **`GamePhoto`**: sets `Game.cover_photo` if unset. Gated by **GameEdit**.
- **`CharacterPhoto`**: sets `Character.profile_photo` if unset. Gated by **CharacterPhotoUpload**
  for both PC and NPC.
- **`TreasurePhoto`**: unconditionally sets `Treasure.photo` — a treasure has at most one photo, so
  re-uploading always replaces it (no "if unset" guard, unlike the two above). Gated by
  **TreasureEdit** for a global treasure, or **GameEdit** for one exclusive to a game.
- **`GameDocumentPhoto`**: sets `GameDocument.photo` if unset — a document keeps every uploaded
  photo, only its first becomes the display photo. Gated by the document photo-upload permission
  (see [GameDocument](game-document.md)).
- **`StlModelPhoto`**: unconditionally sets `StlModel.photo` — like `TreasurePhoto`, an `StlModel`
  has at most one photo, so re-uploading always replaces it (no "if unset" guard). Gated by
  **Staff-or-superuser** (`require_staff`), not a game/owner-based permission class — `StlModel`
  has no owning-game concept at all.

All cases reuse the checks already enforced at upload creation (token match, requesting user must
be the upload's owner) — only the object-level permission class differs, by `content_object` type.

## Staff-origin uploads

`PATCH /uploads/<upload_type>/<id>.json` on an `origin='staff'` upload (created by
[Staff Photos](staff-photo.md)' replace endpoint) differs from the regular flow:

- **Authorization:** `require_staff` **replaces** the per-type game-edit permission check. The
  token, owning-user, expiry and not-already-uploaded checks still apply, so another staff member
  cannot finalize someone else's upload, and a user demoted mid-upload gets `403` (subject to
  `AdminOrStaffCache`'s usual staleness).
- **Photo gone:** if the photo row was deleted while the replace was in flight (directly, or
  through an owner whose deletion cascades to it), finalize answers `404`
  `{"cleanup_path": <upload.file_path>}` so the proxy removes the file it wrote. The path comes
  from the `Upload` row, never from the request. `GameDocumentFilePhoto` is the exception: its
  owner (`GameDocumentFile.photo`, `SET_NULL`) does not cascade, so the photo row survives and
  finalize succeeds against the now-orphan row.
- `pending → uploading` is unchanged (`{"file_path": ...}`).
- **`uploaded`:** in one transaction, the photo row is locked, its `path` set to the upload's
  `file_path` and `ready` set to `True`. The per-type `mark_ready` handlers are **skipped** — a
  staff replace never changes which photo the owning entity points to. The response is `200`
  `{"previous_path": <old path>}` only when the old path is non-empty and differs from the new
  one (the extension changed), so the proxy can delete the old file; otherwise `200` with no body.

## Copy-origin uploads

`PATCH /uploads/<upload_type>/<id>.json` on an `origin='copy'` upload (a hard-link job created by
a [Staff Copy](staff-copy.md) endpoint, consumed by the proxy link handler) differs from the
regular flow:

- **Authorization:** `require_staff` **replaces** the per-type permission check, exactly as for
  staff-origin uploads (staff are often not editors of the target game). The token, owning-user,
  expiry and not-already-uploaded checks still apply, and the staff check belongs to the
  uniform-`403` group that runs before the `upload_type` `404`, preserving the
  [no-leak ordering](#route-shape-and-the-no-leak-ordering-guarantee).
- **Transitions:** `pending → uploading → uploaded`, and `pending`/`uploading → failed`. A
  `failed` upload accepts no further `PATCH` (uniform `403`, like `uploaded`) until it is renewed.
- **Start:** `status=uploading` returns `{"file_path": ..., "source_path": ...}` (regular and
  staff uploads keep returning only `file_path`).
- **Failure:** `status=failed` with an `error` from the fixed choices records the failure and
  returns `200`. It is `400` when the `error` is missing or outside the choices
  (`{"errors": {"error": ["invalid_error"]}}`), and `400 invalid_status` when sent for a regular
  or staff upload.
- **`uploaded`:** `CopyLinkFinalizer`, in one transaction, locks the copied row and sets
  `ready=True`; when `is_cover` is set, it points the owner's cover `photo` FK at the row. The
  per-type `mark_ready` handlers are **skipped**. The `200` response carries `X-Cache-Clear` with
  the target game's stale paths, supplied by a per-type hook (`staff/copy_links.py`).
- **Cleanup:** a `pre_delete` receiver on every copyable photo/file model (`GameItemPhoto`,
  `GameCommonItemPhoto`, `GameFactionPhoto`, `GamePossessionPhoto`, `GameDocumentPhoto`,
  `GameDocumentFile`, `GameDocumentFilePhoto`) deletes the row's `origin='copy'` uploads when the
  row — or its game, through the cascade — is deleted. A `GenericRelation` is deliberately **not**
  used: it would also delete regular/staff uploads and break `StaffUploadFinalizer`'s
  `404 {cleanup_path}` orphan-file cleanup. A later link `PATCH` then gets `403` (upload not
  found).
- **Renew and pending links:** `POST /staff/copies/links/<upload_id>/renew.json` and
  `GET /staff/copies/links.json` are staff-or-superuser; see [Staff Copy](staff-copy.md).

Regular (`origin='regular'`) uploads keep the behaviour described above unchanged.

## Endpoint summary

Each endpoint below is init-only (creates/reuses the target photo/file row with `ready=False`,
returning `upload_id`/`token`/`id` plus a resource-scoping id); the resource file linked covers the
full access-control picture (hidden-state interaction, storage semantics), so only the permission
and any upload-specific deviation is repeated here.

| Endpoint | Who can call | Deviation |
|----------|-------------|-----------|
| `/games/<slug>/photo_upload.json` | **GameEdit** | — |
| `/games/<slug>/pcs\|npcs/<id>/photo_upload.json` | **CharacterPhotoUpload** | Creates a `CharacterPhoto`; not visible/promotable to profile photo until finalised |
| `/games/<slug>/documents/<id>/photo_upload.json` | Document photo-upload permission (see [GameDocument](game-document.md#document-photo-endpoints)) | Always creates a new row (a document keeps every photo, unlike single-photo resources) |
| `/games/<slug>/documents/<id>/file_upload.json` | Same permission (see [GameDocument](game-document.md#document-file-upload-endpoint)) | `.pdf`-only; the first non-photo upload type in this codebase |
| `/games/<slug>/documents/<document_id>/files/<file_id>/photo_upload.json` | Same permission (see [GameDocument](game-document.md#document-file-photo-upload-endpoint)) | Fixed, deterministic storage path (at most one photo per file); the file's `photo` FK is assigned at *init* time, not finalisation — see that section's `photo_path`-not-gated-on-`ready` note |
| `/treasures/<id>/photo_upload.json` | Superuser always; additionally the owning game's GameMaster when exclusive to a game | Fixed, deterministic storage path (a treasure has at most one photo); reuses the existing row if one exists rather than creating a second |
| `/miniatures/stl_models/<id>/photo_upload.json` | **Staff-or-superuser** (`require_staff`) | Fixed, deterministic storage path (an `StlModel` has at most one photo); reuses the existing row if one exists rather than creating a second |
