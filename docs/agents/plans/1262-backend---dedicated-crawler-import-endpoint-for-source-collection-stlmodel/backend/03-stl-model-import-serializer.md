# StlModel import serializer

Add `StlModelImportSerializer`, separate from `StlModelCreateSerializer` (the existing create
serializer requires `type` and enforces `UniqueValidator` on `url`, both wrong for this
endpoint's upsert semantics).

Accepted fields: `name` (required), `external_id` (optional), `url` (optional, same
`http_url_field` validation as the existing serializers but **no** `UniqueValidator` — a
duplicate `url` is exactly the upsert-match case, not an error), `source_name` (required),
`collection_name` (optional), `collection_external_id` (optional), plus whatever the existing
create endpoint already accepts optionally (`tags`, etc. — reuse `TagsSync` /
`validate_tags_count` / `validate_tag_lengths` from `_tags_sync.py`).

`save()`/`create()`-equivalent logic (a plain method on the serializer, not relying on DRF's
`update_or_create` machinery, since the lookup key varies per-request):

1. Resolve `Source`/`Collection` via `SourceSync`/`CollectionSync` (step 02).
2. Look up an existing `StlModel`: by `external_id` first (if given), then by `url` (if given and
   no `external_id` match found).
3. If found: update whichever of `name`/`url`/`external_id`/`tags`/etc. the caller sent (same
   partial-update semantics as the existing `PATCH` endpoint — do not clobber fields the caller
   omitted).
4. If not found: create with `type=StlModel.TYPE_OTHER`, leaving `size` and the
   `StlModelRace`/`StlModelRole` join rows unset.
5. Either way: add the resolved `Source`/`Collection` to the `StlModel`'s `sources`/`collections`
   M2Ms (`.add(...)`, not `.set(...)`, so re-importing doesn't drop other manually-added
   sources/collections), and re-store whichever of `external_id`/`url` was sent.
6. If `url` is present, create-or-update an `StlModelLink` with `link_type=BaseLink.LINK_TYPE_LOOTSTUDIO`
   pointing at that `url` (match on `stl_model` + `link_type` to avoid duplicate links on
   repeated imports of the same item).

Wrap steps 1–6 in `transaction.atomic()`.

## Files to Change

- `backend/miniatures/serializers/stl_model_import.py` (new) — `StlModelImportSerializer` as
  described above.
- `backend/miniatures/tests/serializers/` — tests: create-new-item (with and without
  `external_id`), update-existing-by-`external_id`, update-existing-by-`url`-fallback,
  `external_id` match takes precedence over a coincidentally-matching `url`, `type: "other"`
  default on create, `lootstudio` link created on first import, link not duplicated on
  re-import, partial-update doesn't clobber omitted fields.
