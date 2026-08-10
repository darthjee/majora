# Source

**Not a [Game/Staff/Account/Sensitive-information resource](principles.md#resource-categories)**
— same shape as [StlModel](stl-model.md): a shared, cross-domain, login-only catalog with no
game/staff/account fit. `Source` (plus its `SourcePhoto` companion, both in the standalone
`miniatures` app) is a deduplicated, global catalog of sites/publishers an `StlModel` can be
attributed to (e.g. "MyMiniFactory", "Printable Scenery") — now a full standalone resource with
its own `name`, `url`, and photo, rather than the name-only, Django-admin-only stub it used to be.
Like `StlModel`, it is not domain-scoped.

The embedded view of `Source` inside `StlModelDetailSerializer.sources` is unaffected by this file
— it stays name-only (see [StlModel](stl-model.md#fields)); attaching a `Source` to an `StlModel`
is not part of this resource's endpoints.

| Action | Who can |
|--------|---------|
| List (`GET /miniatures/sources.json`) | **IsAuthenticated** — no `AllowAny` regular form |
| Detail (`GET /miniatures/sources/<id>.json`) | **IsAuthenticated** |
| Create (`POST /miniatures/sources.json`) | **Staff-or-superuser** (`require_staff`, see [common rules](common-rules.md)) |
| Photo upload (`POST /miniatures/sources/<id>/photo_upload.json`) | **Staff-or-superuser** (`require_staff`) — see [Upload](upload.md) |
| Update/Delete | None — no update/delete endpoints, matching `StlModel`'s own current state |

**Deviation — `X-Skip-Cache: true` on all endpoints, including the writes.** Per [Permission
Principles](principles.md#x-skip-cache-rule), any endpoint not open to `AllowAny` always sets
this header; since every endpoint requires login, they all set it unconditionally, including on
the detail endpoint's 404 response.

## Fields

**List** (`SourceListSerializer`): `id`, `name`, `photo_url` (`null` when no photo is set).

**Detail** (`SourceDetailSerializer`): `id`, `name`, `url`, `photo_url`. The create endpoint
(`201`) returns this same shape.

`url` is a plain `CharField` (max length 200, optional, blank-default), not a `URLField` — a
deliberate deviation from [Link](link.md)'s `URLField`-typed `url`: no format validation is
applied.

## Create endpoint

`POST /miniatures/sources.json` accepts `name` (required, DB-level `unique=True`, so a duplicate
`name` returns `400` via DRF's automatic `UniqueValidator` rather than a raw `500`) and `url`
(optional). Responses: `201` (created, `SourceDetailSerializer` shape), `400` (validation error,
e.g. duplicate `name`), `401` (unauthenticated), `403` (authenticated but not staff/superuser).

## Photo upload

`POST /miniatures/sources/<id>/photo_upload.json` follows the same two-step upload-init protocol
as `StlModel`'s photo upload (see [StlModel](stl-model.md) and [Upload](upload.md)): a `Source`
has at most one photo (`SourcePhoto`, via `Source.photo`), stored at a deterministic path (no
UUID), and each upload replaces the existing photo if one is already set rather than creating a
new row.

## No search/filter yet

`GET /miniatures/sources.json` accepts no query parameters beyond the shared `Paginator`'s `page`/
`per_page` — no name filtering.
