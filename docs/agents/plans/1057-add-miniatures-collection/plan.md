# Plan: Add miniatures/collection

Issue: [1057-add-miniatures-collection.md](../../issues/1057-add-miniatures-collection.md)

## Overview

Add `Collection`, a new resource in the `miniatures` app that mirrors `Source`'s shape and
endpoints almost 1:1 (model, serializers, views, urls, admin, tests, frontend pages, create
modal, i18n), with three deltas: an optional `source` FK, a `stl_models` many-to-many (declared
on `StlModel`), and a photo model that supports a real multi-photo gallery instead of Source's
single-slot replace-on-upload behavior.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

**Endpoints** (all under `miniatures/`, all set `X-Skip-Cache: true`, mirroring `Source`'s own
deviation since every endpoint requires login):

- `GET /miniatures/collections.json` (paginated list, `IsAuthenticated`) → items shaped
  `{id, name, photo_url}` (`photo_url` nullable) `+ stl_model_count` (int).
- `GET /miniatures/collections/<id>.json` (`IsAuthenticated`) →
  `{id, name, url, photo_url, source, stl_models}` where `source` is `{id, name}` or `null`, and
  `stl_models` is `[{id, name}, ...]` (possibly empty).
- `POST /miniatures/collections.json` (staff-or-superuser, `require_staff`) — body
  `{name, url?}`. `source` is **not** accepted on create (starts `null`, assigned later — a
  separate, not-yet-built feature, mirroring how `StlModel.sources` also starts empty on create).
  Returns `201` with the detail shape (`source: null`, `stl_models: []`), `400` on validation
  error (duplicate `name`/`url`, disallowed `url` scheme), `401`, `403`.
- `POST /miniatures/collections/<id>/photo_upload.json` (staff-or-superuser) — same two-step
  upload-init protocol as `Source`/`StlModel`. **Resolution of an ambiguity in the issue text**:
  "several photos (endpoints will come later)" refers to *gallery management beyond the first
  photo* (adding more photos after creation, and re-designating which one is "main") — not to
  this endpoint itself, which the create modal needs working today (issue: "create through the
  modal that will have photo upload, name, url"). So: **every upload creates a new
  `CollectionPhoto` row** (never overwrites, unlike `Source`'s single-slot replace); **the first
  upload for a given collection also sets `Collection.photo`** to that row, since there is
  nothing else to choose from yet. Re-uploading afterwards only appends to the gallery — it does
  not change `Collection.photo`. A dedicated "set main photo among existing gallery photos"
  step (mirroring `Character`'s "set roles" `PATCH`) is genuinely out of scope for this issue.

**Model relationships** (backend-owned, frontend consumes only via the serializer shapes above):
- `Collection.source` — optional `ForeignKey('miniatures.Source', on_delete=SET_NULL, null=True, blank=True, related_name='collections')`.
- `StlModel.collections` — `ManyToManyField('miniatures.Collection', related_name='stl_models', blank=True)`, declared on `StlModel`. No `StlModel` form/UI changes in this issue.
- `Collection.photo` — `ForeignKey('miniatures.CollectionPhoto', on_delete=SET_NULL, null=True, blank=True, related_name='+')`.
- `CollectionPhoto.collection` — `ForeignKey(Collection, on_delete=CASCADE, related_name='photos')`.

**Routes** (frontend hash routes mirror the backend resource segment): `/miniatures/collections`
→ `collections` page key, `/miniatures/collections/:id` → `collection` page key.

## Notes

- `Collection.url` is **unique** (a deviation from `Source.url`) but also **optional** — it must
  be declared `null=True, blank=True` (not just a blank-string default), otherwise the DB unique
  constraint would reject a second collection with no `url` (empty string is a real, colliding
  value; `NULL` is the only value a unique column can repeat across rows in Postgres).
- No cache-warmer (`navi/`) changes: neither `Source` nor `StlModel` has any `navi/resources/*.yml`
  entry today, because every one of their endpoints sets `X-Skip-Cache: true` (all require
  login) — warming a response that's never cached is pointless. `Collection` follows the same
  permission shape, so the same reasoning applies; no navi work needed.
- No `data-access`/`security` agent dispatch needed as a separate plan step — their concerns
  (permission shape, `X-Skip-Cache` on all endpoints, `url` scheme allowlist reused verbatim from
  `Source`) are already resolved above and get implemented directly by `backend`, matching how
  `docs/agents/access-control/source.md` was authored directly by the implementer in the
  reference PR (#1054) rather than as a separate agent deliverable.
