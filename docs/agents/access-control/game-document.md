# GameDocument

A `GameDocument` is a special document belonging to exactly one game (`game` FK, `CASCADE`) —
field-for-field a mirror of [GameItem](game-item.md): it holds its own `name`, `description`,
and optional `photo` directly, plus a `hidden` (`BooleanField`, default `False`) flag scoping its
visibility within that game's catalog. There is still no dedicated update/delete endpoint for
`GameDocument` (left for follow-up issues) — but a dm/admin/staff `POST` endpoint creates a bare
`GameDocument` with no owning `CharacterDocument` (see "Document creation endpoint" below), plus
public/dm-only show endpoints (see "Document detail endpoints" below). Multi-photo
storage/upload/display for `GameDocument.photo` (see "Document photo endpoints" below) works
unlike `GameItem`'s single-always-replace photo model: a document can have multiple stored
`GameDocumentPhoto` rows, one of which is designated the display photo, mirroring the PC/NPC
[CharacterPhoto](character-photo.md) pattern. A document also has a parallel `GameDocumentFile`
collection (`related_name='files'`), so it can hold uploaded PDF files (not only scanned photos)
— see "Document file upload endpoint" below; unlike the photo collection, there is no "display
file" concept and no dedicated files-listing endpoint yet.

## Document index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/documents.json` | GET | **AllowAny** | Paginated list of `GameDocumentListSerializer` objects (`id`, `name`, `photo_path`) for the game's non-hidden documents |
| `/games/<slug>/documents/all.json` | GET | **GameEdit** | DM-only variant: does not exclude hidden documents, and each document additionally carries a `hidden: boolean` field (via `GameDocumentAllListSerializer`, a `GameDocumentListSerializer` subclass used only by this endpoint). Always sets `X-Skip-Cache: true` |

Unknown `game_slug` → 404. Both endpoints order by `id`.

**Exposed fields** (read, index): `id`, `name`, `photo_path` — all non-sensitive; `description`
is intentionally omitted from both index endpoints (card/preview UI never renders it — see
`GameDocumentDetailSerializer` below for where it is exposed). `GET /games/<slug>/documents/all.json`
additionally exposes `hidden` — see the `hidden` section below; no other read endpoint exposes it.

`photo_path` — see [Photo path fields](common-rules.md#photo-path-fields) above; `null` until a
photo is uploaded for the document (see "Document photo endpoints" below) — the first photo ever
uploaded for a document automatically becomes its display photo.

## `hidden`

`hidden` lives directly on `GameDocument` (not on a separate per-game link row, since
`GameDocument` already belongs to exactly one game) — a plain field, default `False`, never
inherited by a `CharacterDocument` that links to it (see
[CharacterDocument](character-document.md) below, whose own `hidden` is independent). It is:
- Excluded from `GET /games/<slug>/documents.json` (the regular catalog list).
- Exposed (per document) only on `GET /games/<slug>/documents/all.json`, gated by
  `GameEditPermission` (that game's GameMaster, or a superuser/staff) — the same permission
  class used by `GET /games/<slug>/items/all.json`.

There is no buy/sell flow, or NPC/PC "held document hidden" filter tied to
`GameDocument.hidden` itself — see [CharacterDocument](character-document.md) below for the
separate, per-character `hidden` flag that governs a PC's/NPC's own held-document list.

## Document detail endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/documents/<document_id>.json` | GET | **AllowAny** | `GameDocumentDetailSerializer` object (`id`, `name`, `photo_path`, `description`) for a single non-hidden document; 404 if the document is hidden or unknown |
| `/games/<slug>/documents/<document_id>/full.json` | GET | **GameEdit** | DM-only variant: returns the document even if hidden, and additionally carries `hidden` (via `GameDocumentDetailFullSerializer`). Always sets `X-Skip-Cache: true` |

Unknown `game_slug` or `document_id` (or a document belonging to a different game) → 404. `GET`
mirrors the two index endpoints above in permission/visibility semantics, narrowed to a single
row, but uses detail-only serializer subclasses (`GameDocumentDetailSerializer`/
`GameDocumentDetailFullSerializer`, each extending the corresponding index serializer) that add
`description` back on top of the lean index fields — no permission class changed. There is no
`PATCH` for `GameDocument` (out of scope — unlike `GameItem`'s `PATCH .../items/<item_id>.json`).
Error responses: `401` `{"errors": {"detail": ["authentication required"]}}` if unauthenticated
and not permitted (full endpoint only); `403` `{"errors": {"detail": ["not allowed"]}}` if
authenticated but not permitted (full endpoint only).

## Document creation endpoint

| Endpoint | Method | Who can call | Request | Response |
|----------|--------|-------------|---------|----------|
| `/games/<slug>/documents.json` | POST | **GameDocumentCreatePermission** — dm, admin, or staff (no owner concept — a bare `GameDocument` has no owning character) | `{ name: string, description?: string, hidden?: boolean }` (`name` required, ≤200 chars; `description` defaults to `''`; `hidden` defaults to `false`) | `201` with `GameDocumentDetailFullSerializer` shape (`id`, `name`, `photo_path`, `description`, `hidden`) |

Shares the same route as the `GET` index endpoint above (`game_documents` now handles both `GET`
and `POST`; `AllowAny` stays at the decorator level so `GET` remains public, with `POST`
authorized inline via `GameDocumentCreatePermission.check`). Creates only a `GameDocument` — no
`CharacterDocument` is created, unlike [CharacterItem](character-item.md)'s equivalent PC/NPC
creation pattern for items. Error responses: `401`
`{"errors": {"detail": ["authentication required"]}}` if unauthenticated; `403`
`{"errors": {"detail": ["not allowed"]}}` if authenticated but not permitted; `404` for an unknown
`game_slug`; `400` `{"errors": {"<field>": ["<message>", ...]}}` on validation failure.

`GameDocumentCreatePermission` (`backend/games/permissions.py`) is `user.is_staff or
game.can_be_edited_by(user)` — mirrors `GameItemCreatePermission`'s shape exactly, since a bare
`GameDocument` has no owning character. A `can_create_document` boolean (backed by the same
permission, including its Staff bypass) is also exposed on the existing
`GET /games/<slug>/permissions.json` response (`GamePermissionsSerializer`), for both the
real-identity and role-simulated (`?role=`) paths, so the frontend can gate its "Create Document"
button off an authoritative server-computed flag — see [Game](game.md)'s "Edit permission"
section above.

## Document photo endpoints

A `GameDocument` can have multiple stored `GameDocumentPhoto` rows (`related_name='photos'`),
one of which is its display photo (`GameDocument.photo`) — the multi-photo PC/NPC
[CharacterPhoto](character-photo.md) pattern, not `GameItem`'s single-always-replace model.
The first photo ever uploaded for a document automatically becomes its display photo (mirroring
`_set_profile_photo_if_unset`); there is no dedicated document-photos browsing page, so a
document's other stored photos beyond its current display photo are not browsable anywhere.

| Endpoint | Method | Who can call | Request | Response |
|----------|--------|-------------|---------|----------|
| `/games/<slug>/documents/<document_id>/photos.json` | GET | **AllowAny**, non-hidden documents only | — | Paginated `GameDocumentPhotoSerializer` list (`id`, `path`) of `ready=True` photos |
| `/games/<slug>/documents/<document_id>/photo_upload.json` | POST | **IsAuthenticated** + `GameDocumentPhotoUploadPermission` | `{ filename: string }` (see [Upload](upload.md)) | `201` `{upload_id, token, document_id}` |
| `/games/<slug>/documents/<document_id>/photos/<photo_id>/set.json` | PATCH | **IsAuthenticated** + `GameDocumentPhotoUploadPermission` | `{"roles": ["display"]}` | `200`, empty body |

The photos-list endpoint scopes its document lookup to `game.documents.filter(hidden=False)`,
mirroring the "Document detail endpoints" pattern above — a hidden document's photos 404 for any
caller, with no `GameEdit`-gated override (unlike the detail/full split), since this issue adds
no dedicated way to browse a hidden document's photos either. The upload-init and set endpoints,
by contrast, look up the document without a `hidden` filter — any user permitted by
`GameDocumentPhotoUploadPermission` may upload or set a photo on a hidden document, since photo
management is an editing action, not a read, and hidden documents are still fully editable by
their game's players/DM/staff.

`GameDocumentPhotoUploadPermission` (`backend/games/permissions.py`) is `user.is_staff or
game.has_player(user) or game.can_be_edited_by(user)` — mirrors `GameItemPhotoUploadPermission`
exactly (staff, any player of the game, or the game's dm/editor), flat across all three
endpoints (no per-action tiering). `photo_id` lookups are scoped to `document.photos` (i.e.
`document.photos.filter(id=photo_id)`), so a `photo_id` belonging to a different document or
game 404s rather than leaking cross-document/cross-game state.

Unknown `game_slug` or `document_id` (or a `document_id` that does not belong to `game_slug`) →
404 for all three endpoints. See [Upload](upload.md#document-photo-upload-init-endpoint) for the
upload-init endpoint's request/response shape and finalisation side effect.

## Document file upload endpoint

A `GameDocument` can also have a collection of uploaded PDF files (`related_name='files'`,
`GameDocumentFile` rows), independent of its photo collection above — there is no single "display
file" and no dedicated listing endpoint for it yet (left for a follow-up).

| Endpoint | Method | Who can call | Request | Response |
|----------|--------|-------------|---------|----------|
| `/games/<slug>/documents/<document_id>/file_upload.json` | POST | **IsAuthenticated** + `GameDocumentFileUploadPermission` | `{ filename: string }` (`.pdf` only) | `201` `{upload_id, token, upload_type: "file", id, document_id}` |

`GameDocumentFileUploadPermission` (`backend/games/permissions.py`) is identical to
`GameDocumentPhotoUploadPermission` above: `user.is_staff or game.has_player(user) or
game.can_be_edited_by(user)`. Unknown `game_slug` or `document_id` (or a `document_id` that does
not belong to `game_slug`) → 404. Uploaded files are stored under
`files/games/<slug>/documents/<document_id>/...` (parallel to the `photos/...` root used by
photo uploads). The response's `id` field is the newly created `GameDocumentFile`'s own id — see
[Upload](upload.md#document-file-upload-init-endpoint) for the upload-init endpoint's full
request/response shape, the `upload_type`-scoped submit/finalize route this introduced, and the
proxy-side PDF validation strategy.

## Document file photo upload endpoint

A `GameDocumentFile` can itself carry at most one photo (`GameDocumentFile.photo`, `SET_NULL`,
`related_name='+'`) — a `GameDocumentFilePhoto` row. Unlike a document's own multi-photo
collection above, this mirrors `GameItem`'s/`Treasure`'s single-always-replace photo model: there
is no gallery, and re-uploading replaces the existing photo rather than adding a new one.

| Endpoint | Method | Who can call | Request | Response |
|----------|--------|-------------|---------|----------|
| `/games/<slug>/documents/<document_id>/files/<file_id>/photo_upload.json` | POST | **IsAuthenticated** + `GameDocumentFilePhotoUploadPermission` | `{ filename: string }` (image extensions only — `.jpg`/`.jpeg`/`.png`/`.webp`/`.gif`) | `201` `{upload_id, token, upload_type: "image", id, file_id}` |

`GameDocumentFilePhotoUploadPermission` (`backend/games/permissions.py`) is identical to
`GameDocumentFileUploadPermission` above: `user.is_staff or game.has_player(user) or
game.can_be_edited_by(user)` (dm, admin, player, or staff — matching the issue's stated role
set). Unknown `game_slug`, `document_id` (not belonging to `game_slug`), or `file_id` (not
belonging to `document_id`) → 404. Uses a fixed, deterministic storage path
(`photos/games/<slug>/documents/<document_id>/files/<file_id>/photo.<ext>`, no random UUID)
since a file has at most one photo: if the file already has a photo, the existing
`GameDocumentFilePhoto` row is reused (`path` updated, `ready` reset to `False`); otherwise a new
row is created and assigned to `file.photo` immediately (not deferred to finalisation, unlike
`GamePhoto`/`CharacterPhoto`/`GameDocumentPhoto`'s "if unset" pattern). The response's `id` field
is the `GameDocumentFilePhoto`'s own id (distinct from `file_id`, the target file's id).

**Note — `photo_path` is not gated on `ready`:** because `file.photo` is assigned at *init* time
rather than finalisation, `GameDocumentFileSerializer.photo_path` (`source='photo.path'`, exposed
via `GET /games/<slug>/documents/<document_id>/files.json` and `.../files/all.json`, both public
for a non-hidden document's already-`ready=True` files) reflects whatever photo is currently
attached regardless of that photo's own `ready` flag — unlike the `photo_path`/`cover_photo`/
`profile_photo` fields for `Game`/`Character`/`GameDocument` itself (see [Photo path
fields](common-rules.md#photo-path-fields)), which are only ever set once their upload is
finalised. In practice this means a file's `photo_path` can point at a path with no uploaded
content yet (freshly initiated upload) or briefly at content mid-replacement (re-upload in
progress) before the corresponding `PATCH /uploads/image/<id>.json` finalises it. This is a gap
in `GameDocumentFileSerializer` — flagged here rather than silently documented as a guarantee it
doesn't provide.
