# Collection

**Not a [Game/Staff/Account/Sensitive-information resource](principles.md#resource-categories)**
— same shape as [Source](source.md) and [StlModel](stl-model.md): a shared, cross-domain,
login-only catalog with no game/staff/account fit. `Collection` (plus its `CollectionPhoto`
companion, both in the standalone `miniatures` app) is a named grouping of related `StlModel`s
(e.g. a monster pack or terrain set), optionally attributed to a `Source`. Like `Source` and
`StlModel`, it is not domain-scoped.

`Collection.source` is an optional `ForeignKey` to `Source` (`on_delete=SET_NULL`), and
`StlModel.collections` is a `ManyToManyField` back to `Collection` (`related_name='stl_models'`,
declared on `StlModel`) — mirroring `StlModel.sources`'s own M2M shape. Neither relationship is
settable through any endpoint yet; both start empty/unset on `Collection`/`StlModel` creation and
are attached later via a separate, not-yet-built feature.

| Action | Who can |
|--------|---------|
| List (`GET /miniatures/collections.json`) | **IsAuthenticated** — no `AllowAny` regular form |
| Detail (`GET /miniatures/collections/<id>.json`) | **IsAuthenticated** |
| Create (`POST /miniatures/collections.json`) | **Staff-or-superuser** (`require_staff`, see [common rules](common-rules.md)) |
| Photo upload (`POST /miniatures/collections/<id>/photo_upload.json`) | **Staff-or-superuser** (`require_staff`) — see [Upload](upload.md) |
| Update/Delete | None — no update/delete endpoints, matching `Source`/`StlModel`'s own current state |

**Deviation — `X-Skip-Cache: true` on all endpoints, including the writes.** Per [Permission
Principles](principles.md#x-skip-cache-rule), any endpoint not open to `AllowAny` always sets
this header; since every endpoint requires login, they all set it unconditionally, including on
the detail endpoint's 404 response.

## Fields

**List** (`CollectionListSerializer`): `id`, `name`, `photo_url` (`null` when no photo is set),
`stl_model_count` (int, the count of linked `StlModel`s).

**Detail** (`CollectionDetailSerializer`): `id`, `name`, `url`, `photo_url`, `source` (`{id,
name}`, or `null` when unset), `stl_models` (list of `{id, name}`, possibly empty). The create
endpoint (`201`) returns this same shape (`source: null`, `stl_models: []`, since neither is
settable on create).

`url` is a plain `CharField` (max length 200, optional, **unique**), not a `URLField` — same
no-format-validation deviation as [Source](source.md)'s `url`, but unlike `Source.url` it is also
unique. It defaults to `None` (a real DB `NULL`), not `''`, specifically so that multiple
url-less `Collection`s never collide under the `unique=True` constraint — a blank-string default
(`Source.url`'s own default) would make every second url-less row a duplicate.

## Create endpoint

`POST /miniatures/collections.json` accepts `name` (required, DB-level `unique=True`, so a
duplicate `name` returns `400` via DRF's automatic `UniqueValidator`) and `url` (optional,
DB-level `unique=True`, same `400`-on-duplicate behavior — but only when a non-`null` value is
submitted; DRF's validator pipeline skips a field entirely when its value is `None`, so two
`Collection`s each posted with no `url` never trip the validator). `source` is **not** accepted
on create — a new `Collection` always starts with `source: null`, assigned later via a separate,
not-yet-built feature (mirroring how `StlModel.sources` also starts empty on create). Responses:
`201` (created, `CollectionDetailSerializer` shape), `400` (validation error, e.g. duplicate
`name`/`url`, disallowed `url` scheme), `401` (unauthenticated), `403` (authenticated but not
staff/superuser).

## Photo upload

`POST /miniatures/collections/<id>/photo_upload.json` follows the same two-step upload-init
protocol as [Source](source.md#photo-upload)'s photo upload (see [Upload](upload.md)), but with
different photo-slot semantics: unlike `Source`, which has at most one photo (replaced on every
upload), a `Collection` supports a real multi-photo gallery via `CollectionPhoto.collection`
(`related_name='photos'`).

- **Every upload creates a new `CollectionPhoto` row** — never reuses or overwrites an existing
  one, and stores it at a UUID-suffixed path (`use_uuid=True`), unlike `Source`'s deterministic
  single path.
- **The first upload for a given collection also sets `Collection.photo`** to that new row, since
  there is nothing else to choose from yet.
- Re-uploading afterwards only appends another row to the gallery — it does **not** change
  `Collection.photo`.
- A dedicated "set main photo among existing gallery photos" step (mirroring `Character`'s "set
  roles" `PATCH`) is out of scope for this resource today; gallery browsing/management endpoints
  beyond the first upload are not yet built.

## No search/filter yet

`GET /miniatures/collections.json` accepts no query parameters beyond the shared `Paginator`'s
`page`/`per_page` — no name filtering.
