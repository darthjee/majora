# Staff Photos (cross-type photo management)

**[Staff resource](principles.md#resource-categories).** Five staff-only endpoints list, replace
and delete photo rows across **all 13 photo types**, independently of any game role. Every endpoint
enforces **Staff-or-superuser** inline (`require_staff`, backed by `AdminOrStaffCache`), matching
every other `staff/*` endpoint, and every response sets `X-Skip-Cache: true` per the
[`X-Skip-Cache` rule](principles.md#x-skip-cache-rule). There is no `EndpointPermission` /
`permissions.yaml` entry — those are for game resources.

| Action | Who can |
|--------|---------|
| Read the index (`GET /staff/photos.json`) | **Staff-or-superuser** |
| List every photo of a type (`GET /staff/photos/<photo_type>.json`) | **Staff-or-superuser** |
| Start a replace (`POST /staff/photos/<photo_type>/<photo_id>/replace.json`) | **Staff-or-superuser** |
| Check deletability (`GET /staff/photos/<photo_type>/<photo_id>/deletable.json`) | **Staff-or-superuser** |
| Delete a photo row (`DELETE /staff/photos/<photo_type>/<photo_id>.json`) | **Staff-or-superuser** |

A DM or game admin **without** staff gets `403` on all of these, even for their own games' photos —
they keep using the per-entity photo endpoints.

## Photo types

`photo_type` is a slug validated against the allow-list registry in `backend/staff/photo_types.py`
(no dynamic model lookup by name); an unknown slug is `404`. In order: `game`, `game_faction`,
`game_item`, `game_common_item`, `game_document`, `game_document_file`, `game_possession`,
`character`, `character_item`, `treasure`, `stl_model`, `source`, `collection`. Each entry only
looks up its own model, so the id of another type's photo is `404`.

## Check order

`require_staff` runs **before** `photo_type` / `photo_id` are resolved: unauthenticated callers
get `401` and non-staff callers `403` whether or not the type or photo exists, so these endpoints
are not an existence oracle.

## Endpoints

- **`GET /staff/photos.json`** — `{"max_dimension": <int>, "types": [<slug>, ...]}`.
  `max_dimension` is the longest-side resize limit, read from `MAJORA_PHOTO_MAX_DIMENSION`
  (default `1024`, clamped to at least `1`); `types` is the registry order above.
- **`GET /staff/photos/<photo_type>.json`** — paginated plain JSON array (pagination in headers,
  see [Pagination](../pagination.md)) of **every** row of that type, including not-ready ones,
  newest first. Each item: `id`, `path`, `ready`, `replace_in_progress` (an active upload exists),
  and `owner` = `{type, id, name, kind, game}` — `kind` is `"pc"`/`"npc"` for characters and
  `null` otherwise; `game` is `{slug, name}` or `null` for non-game-scoped owners (miniatures,
  global treasures); `owner` itself is `null` for a `GameDocumentFilePhoto` no file points at.
- **`POST /staff/photos/<photo_type>/<photo_id>/replace.json`** — body `{"filename": ...}`,
  validated like `PhotoUploadSerializer` (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`; else `400`).
  The target path is the photo's **stored** stem plus the filename's **lowercased** extension —
  the client's stem is ignored, so the request cannot influence the directory or name. Creates a
  staff `Upload` (`origin='staff'`) linked to the existing row and answers `201`
  `{upload_id, token, upload_type, id, photo_type}`. The photo row and its owner's `photo` FK are
  untouched until finalize (see [Upload](upload.md#staff-origin-uploads)). `422`
  `{"errors": {"path": ["photo_path_missing"]}}` when the photo has no stored path; `409`
  `{"errors": {"upload": ["replace_in_progress"]}}` while an active upload exists.
- **`GET /staff/photos/<photo_type>/<photo_id>/deletable.json`** — consumed by the proxy delete
  orchestration, same contract as the character-photo flow: `200` `{"deletable": true, "path":
  <file path>}`, or `422` with no body while an active upload exists. Unlike the character-photo
  check, ready photos are deletable. Exposes the file path to staff only.
- **`DELETE /staff/photos/<photo_type>/<photo_id>.json`** — `204`; `422` while an active upload
  exists. Removes the photo row. For gallery owners (`Game`, `Character`, `GameDocument`,
  `Collection`) whose current `photo` was the deleted row, `photo` falls back to the most recent
  **ready** sibling, or `NULL`; other owners get `NULL` through `SET_NULL`. The file itself is
  deleted by the proxy.

An **active upload** is an `Upload` linked to the photo with status `pending`/`uploading` that has
not expired; an expired leftover never blocks a photo.

## Accepted risks

Staff-only, low-severity edge cases found in the #1470 security review and accepted for now:

- **Orphan rows sharing a live path:** some photo types use a fixed path with no UUID (e.g.
  `photos/games/<slug>/factions/<id>/photo.<ext>`, `treasures/<id>/photo.<ext>`), so an orphan
  photo row (one its owner no longer points to) may share its path with the live row. Deleting the
  orphan, or replacing it, through these endpoints then acts on the live row's file too (the proxy
  deletes or overwrites it). Staff should check `owner` before acting on such rows.
- **Concurrent regular upload:** the regular per-entity init endpoints do not refuse while a staff
  replace is in flight on the same photo row. If an editor uploads in parallel and the staff
  replace then finalizes with a changed extension, the returned `previous_path` may point at the
  editor's new file. This needs concurrent staff and editor activity on the same photo.
- **Unbounded `per_page`:** the shared `Paginator` does not cap `per_page` (pre-existing), so the
  list endpoint can load a whole photo table in one staff request.
