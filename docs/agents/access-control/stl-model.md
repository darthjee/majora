# StlModel

**Not a [Game/Staff/Account/Sensitive-information resource](principles.md#resource-categories)**
— a new, fifth shape: a shared, cross-domain, login-only catalog with no game/staff/account fit.
`StlModel` (plus its `StlModelLink`, `StlModelPhoto`, `Source`, `Tag` companions, all in the
standalone `miniatures` app) catalogs STL 3D-printable files/miniatures that Majora only links to,
never hosts. Unlike [Game](game.md), it is intentionally not domain-scoped — it has no `domain`
field and is available across every domain. `Source` is now its own standalone catalog resource
with its own endpoints — see [Source](source.md); `Tag` and `StlModelLink` remain
Django-admin-only.

`StlModel` also has a `collections` many-to-many field (`related_name='stl_models'` on
[Collection](collection.md)) — mirroring `sources`'s own M2M shape, it is settable on create via
`collection_ids` (see [Create endpoint](#create-endpoint) below) and readable on the detail
endpoint (see [Fields](#fields) below).

| Action | Who can |
|--------|---------|
| List (`GET /miniatures/stl_models.json`) | **IsAuthenticated** — no `AllowAny` regular form |
| Detail (`GET /miniatures/stl_models/<id>.json`) | **IsAuthenticated** |
| Create (`POST /miniatures/stl_models.json`) | **Staff-or-superuser** (`require_staff`, see [common rules](common-rules.md)) |
| Photo upload (`POST /miniatures/stl_models/<id>/photo_upload.json`) | **Staff-or-superuser** (`require_staff`) — see [Upload](upload.md) |
| Update/Delete | None — still no update/delete endpoints; `Tag`/`StlModelLink` remain Django-admin-only for now (see [Source](source.md) for `Source`'s own, now-standalone, permissions) |

**Deviation — `X-Skip-Cache: true` on all endpoints, including the writes.** Per [Permission
Principles](principles.md#x-skip-cache-rule), any endpoint not open to `AllowAny` always sets
this header; since every endpoint requires login, they all set it unconditionally, including on
the detail endpoint's 404 response.

## Fields

**List** (`StlModelListSerializer`): `id`, `name`, `photo_url` (`null` when no photo is set).

**Detail** (`StlModelDetailSerializer`): `id`, `name`, `photo_url`, `links` (`id`, `text`, `url`,
`link_type` — same shape as [Link](link.md)'s `GameLinkSerializer`), `sources` (`name` only, no
`id`), `collections` (`name` only, no `id`, via `CollectionSerializer` — mirrors `sources`'s
shape), `tags` (flat array of strings, not `{id, name}` objects). The create endpoint (`201`)
returns this same shape.

## Create endpoint

`POST /miniatures/stl_models.json` accepts `name` (required), `tags` (optional array of strings,
max **20** entries), `source_ids` (optional array of `Source` ids, default `[]`), and
`collection_ids` (optional array of `Collection` ids, default `[]`) — each validated one-by-one via
`PrimaryKeyRelatedField` (an unknown id in either list returns `400`) and bulk-`.set()` onto the
new `StlModel`'s `sources`/`collections` M2Ms after creation; omitting either leaves the
corresponding M2M empty. Each `tags` entry is trimmed/lowercased and resolved via
`Tag.objects.get_or_create`, so tags are case-insensitively deduplicated and shared globally
across `StlModel`s. A `tags` entry longer than `Tag.name`'s DB `max_length` (200), or a `tags`
list over 20 entries, returns `400` before any DB write. Responses: `201` (created,
`StlModelDetailSerializer` shape), `400` (validation error), `401` (unauthenticated), `403`
(authenticated but not staff/superuser).

## No search/filter yet

`GET /miniatures/stl_models.json` accepts no query parameters beyond the shared `Paginator`'s `page`/
`per_page` — no name/source/tag filtering, despite issue #1017's title. Deferred to a follow-up
issue. (`GET /miniatures/sources.json` and `GET /miniatures/collections.json` do accept a `name`
filter now — see [Source](source.md) and [Collection](collection.md).)
