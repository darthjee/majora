# Backend Plan: Fixes to miniatures

Main plan: [plan.md](plan.md)

## Shared contracts

You must produce (consumed by `frontend`, see [plan.md](plan.md)'s "Shared contracts"):

- `POST /miniatures/collections.json` accepts optional `source_id` (int or `null`).
- `POST /miniatures/stl_models.json` accepts optional `source_ids`/`collection_ids` (arrays of
  int, default `[]`).
- `GET /miniatures/sources.json` and `GET /miniatures/collections.json` accept an optional `name`
  query param (case-insensitive substring match).
- `GET /miniatures/stl_models/:id.json` response gains `collections: [{name: string}]`.

No DB migration is required — `Collection.source`, `StlModel.sources`, and `StlModel.collections`
already exist on the models.

## Implementation Steps

### Step 1 — New shared `common` app: `filter_by_name`

The exact same `name`-substring-search behavior already exists twice, copy-pasted:
`games/views/games/_treasure_filters.py::filter_by_name(request, queryset, field='name')` and
`games/views/game/_shared.py::_filter_by_character_name(request, queryset)`. Extract it once,
following the precedent set by the existing `permissions` app (a small, no-model, cross-cutting
app already imported across `games`/`miniatures`/others):

1. Create `backend/common/` as a new Django app:
   - `backend/common/__init__.py`
   - `backend/common/apps.py` — a minimal `AppConfig` (mirror `backend/permissions/apps.py`'s
     shape).
   - `backend/common/query_filters.py`:
     ```python
     def filter_by_name(request, queryset, field='name'):
         """Filter queryset to a case-insensitive substring match on `<field>` from the `name` query param."""
         name = request.query_params.get('name')
         if not name:
             return queryset
         return queryset.filter(**{f'{field}__icontains': name})
     ```
   - `backend/common/tests/query_filters_test.py` — unit tests: no `name` param → unchanged
     queryset; blank `name` → unchanged; a real substring → filters case-insensitively; a custom
     `field` argument filters that field instead of `name`.
2. Add `'common'` to `INSTALLED_APPS` in `backend/majora_project/settings.py`, placed after
   `'permissions'`.
3. Refactor the two existing `games` copies to delegate to the new shared helper instead of
   duplicating the logic:
   - `games/views/games/_treasure_filters.py::filter_by_name` — replace its body with a
     call-through to `common.query_filters.filter_by_name` (keep the function so existing callers
     in `games/views/games/game_treasures_all.py`, `games/views/games/game_treasure_detail.py`,
     `games/views/games/game_treasures.py`, `games/views/treasures/treasures_list.py`,
     `games/views/game/_treasures.py`, `games/views/game/_document_exchange.py`,
     `games/views/game/_item_exchange.py` don't need to change their imports).
   - `games/views/game/_shared.py::_filter_by_character_name` — same: body becomes a call-through
     to `common.query_filters.filter_by_name(request, queryset, field='name')`, keeping its
     existing name/signature for its own call sites.
   - Run the existing test suites for both modules to confirm no behavior changed.

### Step 2 — `sources.json`/`collections.json`: `name` search

- `backend/miniatures/views/sources_list.py`: import `filter_by_name` from `common.query_filters`
  and apply it to the `Source.objects.all()` queryset before pagination (`GET` branch only).
- `backend/miniatures/views/collections_list.py`: same, applied to `Collection.objects.all()`.
- Add/extend tests in `backend/miniatures/tests/views/sources_list_test.py` and
  `collections_list_test.py`: `?name=<substring>` narrows results case-insensitively; no `name`
  param returns the full (paginated) list as before.

### Step 3 — `Collection` create accepts `source_id`

- `backend/miniatures/serializers/collection_create.py`: add
  ```python
  source_id = serializers.PrimaryKeyRelatedField(
      source='source', queryset=Source.objects.all(), required=False, allow_null=True,
  )
  ```
  to `CollectionCreateSerializer`, add `'source_id'` to `Meta.fields`, and update/remove the
  class's current docstring paragraph that says `source` is rejected on create (it no longer is).
- Update `backend/miniatures/tests/serializers/collection_create_test.py`: creating with a valid
  `source_id` sets `Collection.source`; omitting it still creates with `source=None`; an
  unknown/invalid `source_id` returns a 400.

### Step 4 — `StlModel` create accepts `source_ids`/`collection_ids`

- `backend/miniatures/serializers/stl_model_create.py`:
  - Add
    ```python
    source_ids = serializers.PrimaryKeyRelatedField(
        source='sources', queryset=Source.objects.all(), many=True, required=False, default=list,
    )
    collection_ids = serializers.PrimaryKeyRelatedField(
        source='collections', queryset=Collection.objects.all(), many=True, required=False, default=list,
    )
    ```
  - Add `'source_ids'`, `'collection_ids'` to `Meta.fields`.
  - In `create()`: pop `sources`/`collections` from `validated_data` (same pattern already used
    for `tags`) before `StlModel.objects.create(**validated_data)`, then after creation call
    `stl_model.sources.set(sources)` and `stl_model.collections.set(collections)` — a single bulk
    `.set()` each, not a per-entry loop like `TagsSync` (these reference existing rows, already
    validated one-by-one via `PrimaryKeyRelatedField`, so no `TagsSync`-style get-or-create is
    needed and no `MAX_TAGS`-style count cap is added).
  - Update/remove the docstring paragraph currently saying `sources` is out of scope on create.
- Update `backend/miniatures/tests/serializers/stl_model_create_test.py`: creating with
  `source_ids`/`collection_ids` links the given `Source`s/`Collection`s; omitting either leaves
  the corresponding M2M empty; an unknown id in either list returns a 400.

### Step 5 — Expose `StlModel.collections` on the detail serializer

- Add `backend/miniatures/serializers/collection.py`:
  ```python
  """Collection serializer for the miniatures app."""

  from rest_framework import serializers

  from miniatures.models import Collection


  class CollectionSerializer(serializers.ModelSerializer):
      """Serializer for a `StlModel`'s collections -- name only, no id."""

      class Meta:
          """Metadata for the CollectionSerializer."""

          model = Collection
          fields = ['name']
  ```
  (mirrors the existing `backend/miniatures/serializers/source.py::SourceSerializer` exactly).
- `backend/miniatures/serializers/stl_model_detail.py`: import it, add
  `collections = CollectionSerializer(many=True, read_only=True)`, add `'collections'` to
  `Meta.fields`.
- `backend/miniatures/serializers/__init__.py`: export the new `CollectionSerializer` alongside
  the existing exports.
- Update `backend/miniatures/tests/serializers/stl_model_detail_test.py`: a `StlModel` with linked
  collections serializes `collections` as `[{"name": ...}, ...]`; one with none serializes `[]`.

## Files to Change

- `backend/common/__init__.py` — new app package
- `backend/common/apps.py` — new app config
- `backend/common/query_filters.py` — new shared `filter_by_name`
- `backend/common/tests/query_filters_test.py` — new tests
- `backend/majora_project/settings.py` — register `common` in `INSTALLED_APPS`
- `backend/games/views/games/_treasure_filters.py` — delegate `filter_by_name` to `common`
- `backend/games/views/game/_shared.py` — delegate `_filter_by_character_name` to `common`
- `backend/miniatures/views/sources_list.py` — apply `filter_by_name`
- `backend/miniatures/views/collections_list.py` — apply `filter_by_name`
- `backend/miniatures/tests/views/sources_list_test.py` — `name` filter tests
- `backend/miniatures/tests/views/collections_list_test.py` — `name` filter tests
- `backend/miniatures/serializers/collection_create.py` — add `source_id`
- `backend/miniatures/tests/serializers/collection_create_test.py` — `source_id` tests
- `backend/miniatures/serializers/stl_model_create.py` — add `source_ids`/`collection_ids`
- `backend/miniatures/tests/serializers/stl_model_create_test.py` — `source_ids`/`collection_ids` tests
- `backend/miniatures/serializers/collection.py` — new `CollectionSerializer` (name-only)
- `backend/miniatures/serializers/stl_model_detail.py` — add `collections` field
- `backend/miniatures/serializers/__init__.py` — export `CollectionSerializer`
- `backend/miniatures/tests/serializers/stl_model_detail_test.py` — `collections` field tests

## CI Checks

- `backend`: `docker-compose run --rm majora_tests poetry run pytest` (CI job: `pytest_all`, plus
  `pytest_views_rest`/`pytest_views_characters` if `games` view tests are touched)
- `backend`: `docker-compose run --rm majora_app poetry run ruff check .` (CI job: `checks`)

## Notes

- No migration needed — every FK/M2M this issue touches already exists on the models.
- `data-access`/`security` should review this PR's serializer changes (new writable fields,
  newly-exposed `collections` read field) before merge — not this agent's own step, flagging for
  the reviewing/orchestrating agent.
