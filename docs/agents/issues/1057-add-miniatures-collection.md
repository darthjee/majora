# Issue: Add miniatures/collection

## Description

Add `Collection`, a new resource in the `miniatures` app (alongside `Source` and `StlModel`) that
groups related STL models. A `Collection` optionally belongs to a `Source` and can be linked to
many `StlModel`s. It gets its own index and show pages, and a create modal mirroring `Source`'s.

## Solution

### Collection ↔ Source relationship

`Collection.source` is a **ForeignKey to `Source`**, not a many-to-many (unlike `StlModel.sources`)
— a collection belongs to at most one source. The field is **optional**:
`source = models.ForeignKey('miniatures.Source', on_delete=models.SET_NULL, null=True, blank=True, related_name='collections')`.

- Optional rather than required: a collection can exist without a source assigned.
- `on_delete=SET_NULL` rather than `CASCADE`/`PROTECT`: deleting a `Source` clears `source` on any
  collections that referenced it, instead of deleting those collections or blocking the delete —
  consistent with `Source.photo`'s own `on_delete=SET_NULL` pattern (note: `Source` currently has
  no delete endpoint, so this is largely forward-looking).
- `related_name='collections'` lets `Source.collections.all()` work, mirroring `StlModel.sources`'s
  `related_name='stl_models'` convention.

### Collection ↔ StlModel relationship

Many-to-many, mirroring the existing `StlModel.sources` pattern exactly:
`collections = models.ManyToManyField('miniatures.Collection', related_name='stl_models', blank=True)`
on `StlModel`. Each `StlModel` can belong to zero to many collections, and each `Collection` can
have zero to many `StlModel`s.

- No changes to the `StlModel` create/edit forms in this issue — the relationship exists at the
  model/DB level only for now; wiring it into the `StlModel` UI is out of scope here.

### Fields & validation

- `name`: required, **unique** (DB-level `unique=True`), matching `Source.name` — a duplicate
  `name` returns `400` via DRF's `UniqueValidator`.
- `url`: **unique** as well (DB-level `unique=True`) — a deviation from `Source.url`, which is
  optional and not unique. Otherwise same shape as `Source.url` (plain `CharField`, max length
  200), no format validation.

### Photo model shape (main + gallery)

Model structure mirrors `Source`/`StlModel`: `Collection.photo` is a single FK to a dedicated
`CollectionPhoto(BasePhoto)` (`on_delete=SET_NULL, null=True, blank=True, related_name='+'`), and
`CollectionPhoto.collection` is a reverse FK back to `Collection` (`related_name='photos'`).

Behavior follows the **PC/NPC (`Character`) gallery pattern**, not `Source`'s "single photo,
replace on upload" pattern:

- Multiple `CollectionPhoto` rows can accumulate for a single `Collection` — a real gallery, not
  a single slot that gets overwritten on every upload.
- The "main photo" is designated separately, by pointing `Collection.photo` at one of the gallery
  rows (mirroring `Character`'s "set roles" `PATCH` step, e.g. `roles=['profile']`), rather than
  being implicitly whichever photo was most recently uploaded.
- As stated in the issue, the upload/gallery/set-main endpoints themselves are **out of scope for
  this issue** and will come later — this section only fixes the target model shape and behavior
  so those endpoints have a clear contract to build against.

### Index & show pages (frontend)

Mirror `Sources.jsx`/`Source.jsx`, with extra fields on top of the base `Source` shape to reflect
Collection's relationships:

- **Index** (list row, extending `SourceListItem`'s `photo_url` + `name`): also show the
  **stl_model count** for each collection.
- **Show** (extending `SourceDetailSerializer`'s `id`/`name`/`url`/`photo_url`): also show the
  **linked source** (name, linking to the source's own show page, when set) and the **linked
  stl_models** (the list of stl_models belonging to this collection).

This implies the list/detail serializers need to expose `stl_model_count` (list) and `source`
(name + id) plus `stl_models` (list, name + id at minimum) (detail) beyond what `Source`'s
serializers expose today.

### Create modal

Follows `SourceNewModal`'s deferred-photo-upload pattern exactly: `name`, `url`, `photoFile` only
— no `source` picker. `Collection.source` starts `null` on create and is assigned later (a
separate, not-yet-built feature), mirroring how `StlModel.sources` also starts empty on create
rather than being set at creation time.

### Permissions

Same as `Source`/`StlModel` (identical shape between the two already):

| Action | Who can |
|--------|---------|
| List (`GET /miniatures/collections.json`) | **IsAuthenticated** |
| Detail (`GET /miniatures/collections/<id>.json`) | **IsAuthenticated** |
| Create (`POST /miniatures/collections.json`) | **Staff-or-superuser** (`require_staff`) |
| Update/Delete | None — no update/delete endpoints, matching `Source`/`StlModel` |

Same `X-Skip-Cache: true` deviation applies (every endpoint requires login).

## Benefits

- Lets users organize STL models into named groupings beyond a single `Source`, closer to how
  real-world publishers bundle related files (e.g. a monster pack or terrain set).
- Reuses proven patterns end-to-end (`Source`'s CRUD/permission shape, `Character`'s photo-gallery
  behavior), keeping the new resource consistent with the rest of the catalog instead of
  introducing a one-off design.
