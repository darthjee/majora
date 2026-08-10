# Issue: Add miniatures source

## Description

Add a list + creation page for the `miniatures` app's `Source` catalog, at
`/#/miniatures/sources`, mirroring the existing `/#/miniatures/stl_models` list +
creation-modal page. This turns `Source` — currently a minimal, admin-only model used only as a
tag on `StlModel.sources` — into a full standalone resource with its own name, url, and photo.

## Problem

`Source` (`backend/miniatures/models/source.py`) exists today only as a deduplicated, unique
`name` used as an `StlModel.sources` many-to-many tag. It has no `url`, no photo, and no own
endpoints or frontend page — it's Django-admin-only (per
`docs/agents/access-control/stl-model.md`). There's no way for staff to curate a `Source` catalog
(e.g. "MyMiniFactory", "Printable Scenery") with a link back to the source site and a
representative photo/logo, the way `StlModel` already supports for itself.

## Expected Behavior

- Authenticated users can browse a paginated list of `Source`s at `/miniatures/sources`, and view
  a `Source`'s detail at `/miniatures/sources/:id`.
- Staff/superusers can create a new `Source` (`name` + optional `url`) via a "New Source" modal,
  mirroring `StlModelNewModal`.
- Staff/superusers can upload/replace a `Source`'s photo from its detail page via click-to-upload,
  mirroring `StlModel.jsx`'s upload flow — a `Source` has at most one photo; each upload replaces
  it.
- No update or delete of `Source` fields (`name`/`url`) is supported yet — matches `StlModel`'s
  own current state.
- Attaching a `Source` to an `StlModel` is not part of this issue.

## Solution

### Data model

Extend the existing `Source` model rather than introducing a new concept:

- Add a `url` field to `Source` — optional (`blank=True`), plain `CharField` (max_length 200), no
  URL-format validation. This is a deliberate deviation from
  `games.models.base_link.BaseLink.url`'s `URLField` (used e.g. by `StlModelLink`); `Source.url`
  is a simple free-text field, not validated/typed as a URL.
- Add a `photo` FK to a new `SourcePhoto` model, mirroring `StlModelPhoto`/`BasePhoto` (single
  photo, replace-on-upload, same pattern as treasures/stl_models).
- Give `Source` its own `list`/`detail`/`create` serializers and endpoints, standalone from
  `StlModel` (new resource, its own list + detail pages).

The existing embedded view — `Source` shown inside `StlModelDetailSerializer.sources` — stays
name-only, unchanged. This issue only adds the standalone `Source` catalog (list/detail/create);
enriching the embedded view with `url`/`photo_url` is left out of scope to keep this issue's
blast radius minimal.

### Serializer fields

Mirrors `StlModelListSerializer`/`StlModelDetailSerializer`'s shapes:

- **List** (`SourceListSerializer`): `id`, `name`, `photo_url` (`null` when no photo is set).
- **Detail**/**Create response** (`SourceDetailSerializer`): `id`, `name`, `url`, `photo_url`.
- **Create** (`SourceCreateSerializer`): accepts `name` (required) and `url` (optional); `name`'s
  DB-level `unique=True` gets DRF's automatic `UniqueValidator`, so a duplicate `name` returns
  `400`, not a `500` from an `IntegrityError`.

### Routing

Plural, matching the `stl_models` convention: `/miniatures/sources` (list) and
`/miniatures/sources/:id` (detail) — not the singular `/miniatures/source`.

### Photo upload flow

Follows the same format as `stl_models` — not an upload-at-creation-time modal:

- The "New Source" creation modal only takes `name` and `url` — no photo field.
- The photo is uploaded afterwards, from the `Source` detail page, via click-to-upload
  (`PhotoUploadModal`), staff/superuser-gated — mirroring `StlModel.jsx`'s
  `showUploadModal`/`handleUploadSuccess` flow exactly.
- Backend: a `source_photo_upload` endpoint mirroring `stl_model_photo_upload` — deterministic
  storage path (no UUID, since a `Source` has at most one photo), reusing/updating the existing
  `SourcePhoto` if one is already set, or creating a new one otherwise. Re-uploading always
  replaces the current photo (same single-photo-replace semantics as treasures/stl_models).

### Permissions

Mirrors `StlModel` exactly (per `docs/agents/access-control/stl-model.md`):

| Action | Who can |
|--------|---------|
| List (`GET /miniatures/sources.json`) | **IsAuthenticated** |
| Detail (`GET /miniatures/sources/<id>.json`) | **IsAuthenticated** |
| Create (`POST /miniatures/sources.json`) | **Staff-or-superuser** (`require_staff`) |
| Photo upload (`POST /miniatures/sources/<id>/photo_upload.json`) | **Staff-or-superuser** (`require_staff`) |
| Update/Delete | None |

Same `X-Skip-Cache: true` deviation as `StlModel` — every endpoint requires login, so all set the
header unconditionally.

### Update/Delete

None for now, matching `StlModel`'s own current state — no update or delete endpoints for
`Source` in this issue.

### Scope boundary — attaching Sources to StlModels

Out of scope for this issue. `StlModelCreateSerializer` already documents that `sources` is
excluded from `StlModel` creation, to be "attached later via a separate feature" — this issue
builds the standalone `Source` catalog (list/create/photo) only; wiring a `Source` onto an
`StlModel` remains a distinct, not-yet-built follow-up.

## Benefits

- Gives staff a real catalog to attribute STL models to their source site, with a link and photo,
  instead of the current name-only, Django-admin-only stub.
- Reuses the exact same list/detail/create/photo-upload patterns already established for
  `StlModel`, minimizing new patterns introduced into the frontend and backend.
