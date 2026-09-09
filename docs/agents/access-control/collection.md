# Collection

**Not a [Game/Staff/Account/Sensitive-information resource](principles.md#resource-categories)**
— same shape as [Source](source.md) and [StlModel](stl-model.md): a shared, cross-domain,
login-only catalog with no game/staff/account fit. `Collection` (plus its `CollectionPhoto`
companion, both in the standalone `miniatures` app) is a named grouping of related `StlModel`s
(e.g. a monster pack or terrain set), optionally attributed to a `Source`. Like `Source` and
`StlModel`, it is not domain-scoped.

`Collection.source` is an optional `ForeignKey` to `Source` (`on_delete=SET_NULL`), and
`StlModel.collections` is a `ManyToManyField` back to `Collection` (`related_name='stl_models'`,
declared on `StlModel`) — mirroring `StlModel.sources`'s own M2M shape. `source` is settable on
`Collection` create via `source_id` (see [Create endpoint](#create-endpoint) below).
`StlModel.collections` is settable on `StlModel` create via `collection_ids` — see
[StlModel](stl-model.md#create-endpoint).

| Action | Who can |
|--------|---------|
| List (`GET /miniatures/collections.json`) | **IsAuthenticated** — no `AllowAny` regular form |
| Detail (`GET /miniatures/collections/<id>.json`) | **IsAuthenticated** |
| Create (`POST /miniatures/collections.json`) | **Staff-or-superuser** (`require_staff`, see [common rules](common-rules.md)) |
| Import/upsert (`POST /miniatures/collections/import.json`) | **Staff-or-superuser** (`require_staff`, same tier as create) — see [Import endpoint](#import-endpoint) below |
| Photo upload (`POST /miniatures/collections/<id>/photo_upload.json`) | **Staff-or-superuser** (`require_staff`) — see [Upload](upload.md) |
| Update/Delete | No dedicated update/delete endpoint on `Collection` itself, but `source`/`name`/`url` can be mutated indirectly — see "Indirect mutation via StlModel import" and "Import endpoint" below |

### Indirect mutation via StlModel import

[StlModel](stl-model.md#import-endpoint)'s `POST /miniatures/stl_models/import.json` (same
**Staff-or-superuser** tier as every other write here) find-or-creates a `Collection` by
`collection_external_id` then `collection_name` (both optional, matched **globally** — not scoped
per `Source`, since `Collection.name` is a globally unique field) and, on every match, unconditionally
(re)assigns `Collection.source` to whichever `Source` was resolved on that call — even overwriting
a different prior `source` or `null`. This is the only way `Collection.source` changes after
creation today. Known limitation: since matching isn't scoped per source, two different `Source`s
importing into a same-named/same-`external_id` `Collection` will cause its `source` to flip to
whichever source was imported last (see `docs/guides/majora/miniatures.md`'s own note on this).

**Deviation — `X-Skip-Cache: true` on all endpoints, including the writes.** Per [Permission
Principles](principles.md#x-skip-cache-rule), any endpoint not open to `AllowAny` always sets
this header; since every endpoint requires login, they all set it unconditionally, including on
the detail endpoint's 404 response.

## Import endpoint

`POST /miniatures/collections/import.json` is a dedicated, single-item upsert endpoint for
automated crawlers (e.g. the Lootstudios crawler), gated at the same **Staff-or-superuser** tier
as create (`require_staff`) — the standalone counterpart to
[StlModel](stl-model.md#import-endpoint)'s own import endpoint, for the case where a crawler needs
to create/update a `Collection` with no sibling `StlModel` payload. Like that endpoint, a repeat
call for an already-imported item is expected and updates the existing row instead of returning
`400`.

Accepts `name` (required), `external_id` (optional, opaque string — the source system's own
stable id), `url` (optional, same field type as create but with no `UniqueValidator`, since a
matching `url` is the expected upsert-match case here), and `source_name` (required —
find-or-creates a [Source](source.md) by name and unconditionally (re)assigns it onto the matched/
created `Collection`, same as the indirect-mutation path above).

Upsert key: an existing `Collection` is matched by `external_id` first, then by `name` as a
fallback (both matched globally, not scoped per `Source` — same known limitation as the indirect
path above).

- Found: `name`/`url` (whichever were sent) are refreshed on the matched row, in addition to the
  `source` reassignment — this is how a `Collection` stub created via `StlModel` import's
  `collection_external_id` (with no `name`) gets filled in with its real `name`/`url` by a later
  call here, order-independent since both endpoints upsert by the same `external_id`. Unlike
  `StlModel` import's own matched-row behavior, this refresh-on-match is opt-in
  (`CollectionSync(update_existing=True)`), used only by this endpoint — the indirect path above
  still only ever reassigns `source` on a match, never `name`/`url`.
- Not found: a new `Collection` is created with the given `name` (required on this endpoint,
  unlike the indirect path's optional `collection_name`, so the placeholder-name fallback
  described above only ever triggers via the indirect `StlModel`-import path, never here).

Responses: `201` (new `Collection` created), `200` (existing `Collection` matched and updated) —
both with `CollectionDetailSerializer` shape, `400` (validation error, e.g. missing `name`/
`source_name`), `401` (unauthenticated), `403` (authenticated but not staff/superuser).

## Fields

**List** (`CollectionListSerializer`): `id`, `name`, `photo_url` (`null` when no photo is set),
`stl_model_count` (int, the count of linked `StlModel`s).

**Detail** (`CollectionDetailSerializer`): `id`, `name`, `url`, `photo_url`, `source` (`{id,
name}`, or `null` when unset), `stl_models` (list of `{id, name}`, possibly empty). The create
endpoint (`201`) returns this same shape (`source` reflects the submitted `source_id`, or `null`
when omitted; `stl_models: []`, since a new `Collection` can't yet be linked to an `StlModel` on
its own create — that link is only settable from the `StlModel` side, via `collection_ids` on
`POST /miniatures/stl_models.json`).

`url` is a plain `CharField` (max length 200, optional, **unique**), not a `URLField` — same
no-format-validation deviation as [Source](source.md)'s `url`, but unlike `Source.url` it is also
unique. It defaults to `None` (a real DB `NULL`), not `''`, specifically so that multiple
url-less `Collection`s never collide under the `unique=True` constraint — a blank-string default
(`Source.url`'s own default) would make every second url-less row a duplicate.

`external_id` (nullable, DB-level `unique=True` `CharField`, added for
[StlModel](stl-model.md#import-endpoint)'s import endpoint) is **not** serialized on any read
endpoint (list/detail/create) — it exists purely as an internal upsert key for that endpoint, not
a field callers can read or set through the regular create flow.

## Create endpoint

`POST /miniatures/collections.json` accepts `name` (required, DB-level `unique=True`, so a
duplicate `name` returns `400` via DRF's automatic `UniqueValidator`), `url` (optional,
DB-level `unique=True`, same `400`-on-duplicate behavior — but only when a non-`null` value is
submitted; DRF's validator pipeline skips a field entirely when its value is `None`, so two
`Collection`s each posted with no `url` never trip the validator), and `source_id` (optional,
nullable, a `Source` id validated via `PrimaryKeyRelatedField` — an unknown id returns `400`;
omitting it or passing `null` leaves `source` unset). Responses: `201` (created,
`CollectionDetailSerializer` shape), `400` (validation error, e.g. duplicate `name`/`url`,
disallowed `url` scheme, unknown `source_id`), `401` (unauthenticated), `403` (authenticated but
not staff/superuser).

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

## Search/filter

`GET /miniatures/collections.json` accepts an optional `name` query param (case-insensitive
substring match on `name`, via the shared `common.query_filters.filter_by_name`), alongside the
shared `Paginator`'s `page`/`per_page`. Omitting/blank `name` returns the full (paginated) list,
unfiltered.
