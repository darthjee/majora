# Upload

The `Upload` model tracks the lifecycle of a photo/file upload (pending → uploading →
uploaded), generically for a `GamePhoto`, `CharacterPhoto`, `GameItemPhoto`,
`CharacterItemPhoto`, `GameDocumentPhoto`, `GameDocumentFile`, or `TreasurePhoto`, via a
`GenericForeignKey` (`content_type`/`object_id`/`content_object`).

An `upload_type` field (`'image'` or `'file'`, default `'image'`, issue #726) records which
validation/storage strategy the proxy applied. It is set at creation time by the initiating
view (existing photo-upload views all keep the default `'image'`; the document file-upload
endpoint below sets `'file'`), included in the init endpoint's response, and re-checked at
finalisation time (see below) — it is not itself an access-control gate on its own (the
per-endpoint permission classes below still apply identically regardless of `upload_type`), but
a defense-in-depth check that the URL's `upload_type` segment matches the row's stored value.

| Action | Who can |
|--------|---------|
| Create (`POST /games/<slug>/photo_upload.json`) | **GameEdit** |
| Create (`POST /games/<slug>/pcs/<id>/photo_upload.json`) | **CharacterPhotoUpload** |
| Create (`POST /games/<slug>/npcs/<id>/photo_upload.json`) | **NpcPlayerEdit** |
| Create (`POST /games/<slug>/documents/<id>/photo_upload.json`) | **GameDocumentPhotoUploadPermission** (staff, any player of the game, or the game's dm/editor — see [Document photo upload init endpoint](#document-photo-upload-init-endpoint) below) |
| Create (`POST /games/<slug>/documents/<id>/file_upload.json`) | **GameDocumentFileUploadPermission** — identical rule to `GameDocumentPhotoUploadPermission` above (staff, any player of the game, or the game's dm/editor); see [Document file upload init endpoint](#document-file-upload-init-endpoint) below |
| Create (`POST /treasures/<id>/photo_upload.json`) | Superuser, or that treasure's owning game's GameMaster when `treasure.game_id` is set (see [Treasure photo upload init endpoint](#treasure-photo-upload-init-endpoint) below) |
| Read | Only the user who initiated the upload (indirectly, via the 201 response at creation time) |
| Update / Delete | No public endpoint; status transitions are handled internally |

**Exposed fields:**
- `id` (int), `token` (secret string), and `upload_type` (`'image'`/`'file'`) — returned in the
  201 response to the authenticated initiator only. `token` is a `secrets.token_urlsafe(32)`
  value and must never be exposed to any user other than the one who created the upload, or
  through any endpoint other than the init response. `upload_type` is not sensitive — it only
  tells the frontend which `:upload_type` URL segment to use for the submit/finalize calls.
- All other fields (`file_path`, `expiration_time`, `status`, `user`, `content_type`,
  `object_id`) are internal and never returned by any endpoint.

**Route shape (issue #726):** the submit route (proxy-facing, client-initiated) is
`POST /uploads/<upload_type>/<id>/submit.json`; the finalize route (backend-facing, called by
the proxy internally) is `PATCH /uploads/<upload_type>/<id>.json` — both carry `upload_type` as
a URL segment, previously just `/uploads/<id>/...`, and the URL segment itself is constrained
to only `image`/`file` at the routing layer (an unrecognized value 404s before the view even
runs). The finalize view looks up the `Upload` row by `id` alone, runs the existing token/
ownership/expiry/status checks first (uniform `403` for any failure, same as before this issue),
and only once those pass does it return `404` if the URL's `upload_type` doesn't match the row's
stored `upload_type`. This ordering is deliberate: the `404` must never be observable by a
caller who hasn't already proven ownership via a valid `X-Upload-Token`, otherwise an
unauthenticated-of-that-upload caller could distinguish "upload doesn't exist" (403) from
"upload exists, wrong type" (404) from "upload exists, right type, not authorized" (403),
leaking the existence and `upload_type` of an arbitrary upload it has no claim to — this would
have broken the endpoint's pre-existing "no distinguishable 404" invariant (see
`test_nonexistent_upload_returns_403` in `upload_finalize_test.py`).

**Side effect on finalisation:** `PATCH /uploads/<upload_type>/<id>.json` with `status=uploaded`
marks the linked photo/file record as `ready=True` and, if its owner does not already have a
primary photo, sets that primary photo reference. Dispatches on the upload's `content_object`
type:
- **`GamePhoto`**: if the photo's game does not already have a `cover_photo`, sets
  `Game.cover_photo` to that photo. Gated by **GameEdit**.
- **`CharacterPhoto`**: if the photo's character does not already have a `profile_photo`, sets
  `Character.profile_photo` to that photo. Gated by **CharacterPhotoUpload** for both a PC and an
  NPC (issue #668 aligned the PC finalize step with the same **CharacterPhotoUpload** rule already
  used at PC upload init, below; issue #713 later aligned the NPC branch the same way).
- **`TreasurePhoto`**: unconditionally sets `Treasure.photo` to that photo — unlike the
  `GamePhoto`/`CharacterPhoto` cases, there is no "if unset" guard, since a treasure has at most
  one photo and re-uploading always replaces it. Gated by **TreasureEdit** for a global
  treasure, or **GameEdit** when the treasure is exclusive to a game.
- **`GameDocumentPhoto`** (issue #727): if the document does not already have a `photo`, sets
  `GameDocument.photo` to that photo — the same "if unset" guard as `GamePhoto`/`CharacterPhoto`,
  since a document keeps every uploaded photo (`related_name='photos'`) and only its first
  upload becomes the display photo. Gated by **`GameDocumentPhotoUploadPermission`** (staff, any
  player of the game, or the game's dm/editor).

All cases reuse the checks already enforced at upload creation (token match, requesting
user must be the upload's owner) — only the object-level permission class differs, chosen by the
`content_object`'s type.

## Game photo upload init endpoint

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/games/<slug>/photo_upload.json` | POST | **GameEdit** | `upload_id`, `token`, `game_id` |

Unknown `game_slug` → 404. Missing or invalid `filename` body field → 400.

## Character photo upload init endpoints

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/games/<slug>/pcs/<id>/photo_upload.json` | POST | **CharacterPhotoUpload** | `upload_id`, `token`, `character_id` |
| `/games/<slug>/npcs/<id>/photo_upload.json` | POST | **CharacterPhotoUpload** | `upload_id`, `token`, `character_id` |

Unknown `game_slug` or `character_id` (or a `character_id` that does not belong to `game_slug`,
or is the wrong PC/NPC type for the endpoint) → 404. Missing or invalid `filename` body field →
400. Creates a `CharacterPhoto` row with `ready=False`; not visible in the character detail's
`photos` list, and cannot become `profile_photo`, until the upload is finalised.

## Document photo upload init endpoint

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/games/<slug>/documents/<id>/photo_upload.json` | POST | **`GameDocumentPhotoUploadPermission`** | `upload_id`, `token`, `document_id` |

Unknown `game_slug` or `document_id` (or a `document_id` that does not belong to `game_slug`) →
404. Missing or invalid `filename` body field → 400. Always creates a new `GameDocumentPhoto` row
with `ready=False` — unlike `GameItem`'s single-always-replace photo, a document keeps every
previously uploaded photo, so re-uploading never reuses or discards an existing row. Not visible
via `GET /games/<slug>/documents/<document_id>/photos.json`, and cannot become the document's
display photo, until the upload is finalised. See [GameDocument's "Document photo
endpoints"](game-document.md#document-photo-endpoints) for the sibling list/set endpoints.

## Document file upload init endpoint

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/games/<slug>/documents/<id>/file_upload.json` | POST | **`GameDocumentFileUploadPermission`** | `upload_id`, `token`, `upload_type` (`'file'`), `document_id` |

Introduced by issue #726 as the first non-photo upload type, so a `GameDocument` can represent a
real in-game document (a PDF), not only a scanned photo. `GameDocumentFileUploadPermission` is
`user.is_staff or game.has_player(user) or game.can_be_edited_by(user)` — identical to
`GameDocumentPhotoUploadPermission` above (staff, any player of the game, or the game's
dm/editor); the required role set for uploading a file is the same as for uploading a photo.

Unknown `game_slug` or `document_id` (or a `document_id` that does not belong to `game_slug`) →
404. Missing or invalid `filename` body field → 400; the file-upload serializer additionally
restricts `filename` to a `.pdf` extension (proxy re-validates MIME `application/pdf` +
extension `pdf` at submit time — see below). Always creates a new `GameDocumentFile` row with
`ready=False`, stored under a `files/games/<slug>/documents/<id>/...` path (parallel to photos'
`photos/...` root, via `PhotoPathBuilder.build(root='files')`). Not visible via any read endpoint
until the upload is finalised — there is no dedicated document-files listing endpoint yet (out of
scope for issue #726, mirroring the fact that a document's non-display photos are likewise not
independently browsable).

At the proxy layer, the file upload's submit request goes through the same generalized
`UploadHandler` (renamed from `PhotoUploadHandler`, issue #726) as photo uploads, dispatching to
a PDF-only validation strategy (MIME `application/pdf` + extension `pdf`) and a separate
`files_path` storage base, keyed off the `:upload_type` URL segment — see [the route shape
section above](#upload) for the submit/finalize URL change this required.

## Treasure photo upload init endpoint

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/treasures/<id>/photo_upload.json` | POST | Superuser always; additionally that treasure's owning game's GameMaster, when `treasure.game_id` is set | `upload_id`, `token`, `treasure_id` |

Uses a fixed, deterministic storage path (`photos/treasures/<id>/photo.<ext>`, no random UUID)
since a treasure has at most one photo. The permission check delegates to **GameEdit** against
the owning game when `treasure.game_id` is set, instead of the plain superuser-only
**TreasureEdit**; a global treasure (`game_id` is `None`) still requires a superuser.

Unknown `treasure_id` → 404. Missing or invalid `filename` body field → 400. If the treasure
already has a `photo` (`treasure.photo_id` is set), the existing `TreasurePhoto` row is reused
(its `path` updated, `ready` reset to `False`) rather than creating a second row; otherwise a new
`TreasurePhoto` row is created with `ready=False`. Either way, the photo is not visible via
`photo_path`, and does not become `Treasure.photo`, until the upload is finalised.
