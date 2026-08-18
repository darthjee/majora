# Miniatures API

Hub: [Majora API Guide](../majora.md)

Covers the `Collection`, `Source`, and `StlModel` resources
(`backend/miniatures/`) — the surface a future STL-site crawler will consume to
create `Source`/`StlModel` links automatically instead of manual entry.

All endpoints require authentication (see [Authentication](../majora.md#authentication)).
Write endpoints additionally require the authenticated user to be staff/admin
(`user.is_staff or user.is_superuser`). Every response carries `X-Skip-Cache: true`
(none of these endpoints are safe to cache at the proxy layer, since every one of
them requires authentication).

## Collections

### `GET /miniatures/collections.json`

List collections. Query params (all optional):

| Param | Type | Effect |
|---|---|---|
| `name` | string | Case-insensitive substring match on `name` |
| `page` | int | Page number (default `1`) |
| `per_page` | int | Page size (default: server-configured pagination size) |

Auth: any authenticated user. Response: paginated list of:

```json
{
  "id": 1,
  "name": "string",
  "photo_url": "string | null",
  "stl_model_count": 0
}
```

Pagination metadata is returned via response headers: `page`, `pages`, `per_page`,
`total`.

### `POST /miniatures/collections.json`

Create a collection. Auth: staff/admin only. Request body:

```json
{
  "name": "string (required, unique)",
  "url": "string | null (optional, http/https only, unique)",
  "source_id": "int | null (optional, FK to an existing Source)"
}
```

Response `201`: full collection detail (see below). Response `400` on validation
failure: `{"errors": {"<field>": ["<error_code>", ...]}}`.

### `GET /miniatures/collections/<id>.json`

Collection detail. Auth: any authenticated user. Response `404`:
`{"errors": {"detail": ["not_found"]}}`. Response `200`:

```json
{
  "id": 1,
  "name": "string",
  "url": "string | null",
  "photo_url": "string | null",
  "source": { "id": 1, "name": "string" } | null,
  "stl_models": [ { "id": 1, "name": "string" }, ... ]
}
```

### `POST /miniatures/collections/<id>/photo_upload.json`

Start a photo upload for a collection. Auth: staff/admin only (this endpoint uses
`AllowAny` at the DRF permission-class level, with the staff check done inline, so
an unauthenticated request gets a `401` rather than falling through to DRF's
default `403`). A collection keeps a *gallery* of photos — every call appends a new
photo (the first upload also becomes the collection's "main" `photo_url`). Request
body:

```json
{ "filename": "string (required, extension must be one of .jpg .jpeg .png .webp .gif)" }
```

Response `201`:

```json
{
  "upload_id": 1,
  "token": "string",
  "upload_type": "image",
  "id": 1,
  "collection_id": 1
}
```

Follow up with the finalize step below to complete the upload.

## Sources

### `GET /miniatures/sources.json`

List sources. Same query params, pagination, and auth as the collections list.
Response item:

```json
{ "id": 1, "name": "string", "photo_url": "string | null" }
```

### `POST /miniatures/sources.json`

Create a source. Auth: staff/admin only. Request body:

```json
{
  "name": "string (required, unique)",
  "url": "string (optional, http/https only, blank allowed, not unique)"
}
```

Response `201`: full source detail. Response `400` on validation failure, same
shape as collections.

### `GET /miniatures/sources/<id>.json`

Source detail. Auth: any authenticated user. Response `404`, same shape as
collections. Response `200`:

```json
{ "id": 1, "name": "string", "url": "string", "photo_url": "string | null" }
```

### `POST /miniatures/sources/<id>/photo_upload.json`

Start a photo upload for a source. Auth: staff/admin only (same `401` vs `403`
behavior as the collection upload endpoint). Unlike collections, a source has at
most one photo — every call replaces the existing one (no gallery). Request/response
shape matches the collection upload endpoint, except the response key is
`source_id` instead of `collection_id`.

## STL Models

### `GET /miniatures/stl_models.json`

List STL models. Query params (all optional):

| Param | Type | Effect |
|---|---|---|
| `name` | string | Case-insensitive substring match on `name` |
| `type` | string | Exact match; one of `terrain`, `prop`, `creature`, `other` |
| `size` | string | Exact match; one of `tiny`, `small`, `medium`, `huge`, `gargantuan`, `life` |
| `race` | string, repeatable | Filter by race(s); values from the race choice list below |
| `roles` | string, repeatable | Filter by role(s); values from the role choice list below |
| `source` | int, repeatable | Filter by source id(s) |
| `collection` | int, repeatable | Filter by collection id(s) |
| `tags` | string, repeatable | Filter by exact tag name(s) |
| `page` / `per_page` | int | Pagination, same as collections/sources |

Invalid `type`/`size` values are silently ignored (not filtered on); invalid
`race`/`roles` values are dropped from the filter set. Response item:

```json
{ "id": 1, "name": "string", "photo_url": "string | null" }
```

### `POST /miniatures/stl_models.json`

Create an STL model. Auth: staff/admin only. Request body:

```json
{
  "name": "string (required)",
  "owned": "bool (optional, default true)",
  "type": "string (required, one of terrain|prop|creature|other)",
  "url": "string | null (optional, http/https only, unique)",
  "size": "string | null (optional, one of tiny|small|medium|huge|gargantuan|life)",
  "races": ["string", ...],
  "roles": ["string", ...],
  "tags": ["string", ...],
  "source_ids": [1, ...],
  "collection_ids": [1, ...]
}
```

- `races`, `roles`, `tags`, `source_ids`, `collection_ids` all default to `[]` when
  omitted.
- `tags`: max 20 entries (else `400` with code `max_tags_exceeded`), each ≤ 200
  chars (else `tag_name_too_long`); stored lowercased, created on demand.
- Race choices: `human`, `elf`, `dwarf`, `halfling`, `gnome`, `half-elf`, `half-orc`,
  `tiefling`, `dragonborn`, `orc`, `goblin`, `turtlefolk`, `cthulhufolk`, `humanoid`,
  `construct`, `monstrosity`, `undead`, `aberration`, `beast`, `alien`, `fiend`,
  `fey`, `giant`, `dragon`, `celestial`, `elemental`, `cyborg`, `plant`, `ooze`.
- Role choices: `barbarian`, `bard`, `cleric`, `druid`, `fighter`, `monk`, `paladin`,
  `ranger`, `rogue`, `sorcerer`, `warlock`, `wizard`, `archer`.

Response `201`: full STL model detail. Response `400` on validation failure, same
shape as collections/sources.

### `GET /miniatures/stl_models/<id>.json`

STL model detail. Auth: any authenticated user. Response `404`, same shape as
collections. Response `200`:

```json
{
  "id": 1,
  "name": "string",
  "owned": true,
  "type": "terrain | prop | creature | other",
  "url": "string | null",
  "size": "tiny | small | medium | huge | gargantuan | life | null",
  "races": ["string", ...],
  "roles": ["string", ...],
  "photo_url": "string | null",
  "links": [
    {
      "id": 1,
      "text": "string",
      "url": "string",
      "link_type": "lootstudio | youtube | diary | music | stl | background | reference | \"\""
    }
  ],
  "sources": [ { "name": "string" }, ... ],
  "collections": [ { "name": "string" }, ... ],
  "tags": ["string", ...]
}
```

### `PATCH /miniatures/stl_models/<id>.json`

Partial update. Auth: staff/admin only. Request body: any subset of `name`,
`owned`, `type`, `url`, `size`, `races`, `roles` (all optional). Note `tags`,
`sources`, and `collections` are **not** editable through this endpoint — they have
their own dedicated flows. If `races`/`roles` are provided, they fully replace the
existing set. Response `200`: full STL model detail (same shape as the `GET`
above). Response `400` on validation failure.

### `POST /miniatures/stl_models/<id>/photo_upload.json`

Start a photo upload for an STL model. Auth: staff/admin only (same `401` vs `403`
behavior as the other upload endpoints). Like sources, an STL model has at most one
photo — every call replaces the existing one. Request/response shape matches the
source upload endpoint, except the response key is `stl_model_id`.

## Finalizing an upload

All three `photo_upload.json` endpoints only *start* an upload — they return an
`upload_id` and a `token`, and the actual photo isn't marked ready until the client
finalizes it:

`PATCH /uploads/image/<upload_id>.json` (`backend/uploads/urls.py`), auth: any
authenticated user, plus header `X-Upload-Token: <token>` (from the
`photo_upload.json` response) must match and the authenticated user must be the
same user that started the upload. Request body:

```json
{ "status": "uploading" | "uploaded" }
```

- `"uploading"` → `200 {"file_path": "<path>"}` (informational; use this to know
  where to actually push the file bytes, e.g. to object storage — not detailed
  further here).
- `"uploaded"` → `200` (empty body); marks the linked photo `ready=True`, at which
  point `photo_url` becomes visible in list/detail responses above.

## Errors

All non-2xx responses follow one of two shapes:

- Not found: `{"errors": {"detail": ["not_found"]}}`, status `404`.
- Validation failure: `{"errors": {"<field>": ["<error_code>", ...], ...}}`,
  status `400`. Error values are DRF error *codes* (e.g. `required`,
  `max_tags_exceeded`), not human-readable messages.
- Auth failure on the upload endpoints (`AllowAny` + inline staff check):
  unauthenticated → `401 {"errors": {"detail": ["authentication_required"]}}`;
  authenticated but not staff → `403 {"errors": {"detail": ["not_allowed"]}}`.
