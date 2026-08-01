# GameDocument

**[Game resource](principles.md#resource-categories).** A `GameDocument` belongs to exactly one
game — field-for-field a mirror of [GameItem](game-item.md): its own `name`, `description`,
optional `photo`, plus `hidden` scoping visibility within the game's catalog. No dedicated
update/delete endpoint (left for follow-up), but a dm/admin/staff `POST` creates a bare
`GameDocument`. Unlike `GameItem`'s single-always-replace photo, a document supports multiple
stored `GameDocumentPhoto` rows (one designated the display photo, mirroring
[CharacterPhoto](character-photo.md)'s pattern), plus a separate `GameDocumentFile` collection
(`related_name='files'`) for uploaded PDFs — no "display file" concept, no files-listing endpoint
yet.

The index/detail pair follows the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern); `hidden` lives directly on
`GameDocument` (not a per-game link row, since it already belongs to exactly one game),
independent of [CharacterDocument](character-document.md)'s own `hidden`.

## Index and detail endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/documents.json` | GET | **AllowAny** — non-hidden |
| `/games/<slug>/documents/all.json` | GET | **GameEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/documents/<document_id>.json` | GET | **AllowAny** — 404 if hidden or unknown |
| `/games/<slug>/documents/<document_id>/full.json` | GET | **GameEdit** — returns even if hidden, adds `hidden`. Always `X-Skip-Cache: true` |

Both index endpoints order by `id` and omit `description` (detail adds it back). Deviation from
the default pattern: there is no `PATCH` for `GameDocument` at all (unlike `GameItem`'s).

## Document creation endpoint

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/documents.json` | POST | **GameDocumentCreatePermission** — roles per [`game_document/endpoints.yml`](../../../backend/games/permissions/config/game_document/endpoints.yml) (`create`; no owner concept) |

Mirrors `GameItemCreatePermission`'s shape exactly. Creates only a `GameDocument` — no
`CharacterDocument`. **Write fields**: `name` (required, ≤200 chars), `description` (defaults to
`''`), `hidden` (defaults to `false`). A `can_create_document` boolean (same permission) is also
exposed on [Game](game.md)'s `permissions.json`.

## Document photo endpoints
The first photo ever uploaded for a document automatically becomes its display photo; no
dedicated document-photos browsing page exists for photos beyond the current display one.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/documents/<document_id>/photos.json` | GET | **AllowAny**, non-hidden documents only — no `GameEdit`-gated override for a hidden document's photos |
| `/games/<slug>/documents/<document_id>/photo_upload.json` | POST | `IsAuthenticated` + **GameDocumentPhotoUploadPermission** — roles per [`game_document/endpoints.yml`](../../../backend/games/permissions/config/game_document/endpoints.yml) (`photo_upload`) |
| `/games/<slug>/documents/<document_id>/photos/<photo_id>/set.json` | PATCH | Same permission |

Fields (photos list): `id`, `path` — only `ready=True` photos. The upload-init and set endpoints
look up the document **without** a `hidden` filter — photo management is an editing action, not a
read, so any permitted user may act on a hidden document. `photo_id` lookups are scoped to the
document's own photos.

## Document file upload endpoint

A `GameDocument` can also hold a collection of uploaded PDF files, independent of its photo
collection — no "display file", no listing endpoint yet.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/documents/<document_id>/file_upload.json` | POST | **GameDocumentFileUploadPermission** — identical rule to GameDocumentPhotoUploadPermission above |

`.pdf`-only (validated server-side and re-validated by the proxy at submit time). See
[Upload](upload.md#endpoint-summary) for the response shape and the submit/finalize route this
introduced.

## Document file photo upload endpoint

A `GameDocumentFile` can itself carry at most one photo — mirrors `GameItem`'s/`Treasure`'s
single-always-replace model (no gallery; re-uploading replaces).

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/documents/<document_id>/files/<file_id>/photo_upload.json` | POST | **GameDocumentFilePhotoUploadPermission** — identical rule to GameDocumentFileUploadPermission above |

Image extensions only. Uses a fixed, deterministic storage path since a file has at most one
photo — if the file already has one, the existing row is reused (not a second row created).

**Note — `photo_path` is not gated on `ready`:** because the file's `photo` FK is assigned at
*init* time rather than finalisation (unlike every other photo-path field in this document set —
see [Photo path fields](common-rules.md#photo-path-fields)), `GameDocumentFileSerializer.photo_path`
(exposed via `.../files.json`/`.../files/all.json`, both public for a non-hidden document's
`ready=True` files) can reflect a freshly-initiated or mid-reupload photo before its own upload is
finalised. This is a known gap, flagged here rather than silently documented as a guarantee it
doesn't provide.
