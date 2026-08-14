# Plan: Retrofit URL format validation onto existing URL fields

Issue: [1108-retrofit-url-format-validation-onto-existing-url-fields.md](../../issues/1108-retrofit-url-format-validation-onto-existing-url-fields.md)

## Overview

Convert `Collection.url`, `Source.url`, and `BaseLink.url` (the abstract base inherited by `StlModelLink`, `CharacterLink`, and `GameLink`) to Django `URLField` with `validators=[URLValidator(schemes=['http', 'https'])]`, matching the pattern `StlModel.url` already uses (added in #820). This is backend-only — no frontend changes are required, since all affected fields are already rendered as plain `<a href={url}>` links with no client-side scheme logic to update (mirrors #820, which was also backend-only).

## Context

- `StlModel.url` (`backend/miniatures/models/stl_model.py:143-149`) is the reference implementation:
  ```python
  url = models.URLField(
      max_length=200, unique=True, null=True, blank=True, default=None,
      validators=[URLValidator(schemes=['http', 'https'])],
  )
  ```
  DRF's `ModelSerializer` auto-derives the equivalent serializer-level validator from the model field, so no custom `validate_url` was needed there.
- `Collection.url` (`backend/miniatures/models/collection.py:19`) is currently `models.CharField(max_length=200, unique=True, null=True, blank=True, default=None)`.
- `Source.url` (`backend/miniatures/models/source.py:11`) is currently `models.CharField(max_length=200, blank=True, default='')`.
- `BaseLink.url` (`backend/games/models/base_link.py:29`, abstract, `inherit=True` history) is currently `models.URLField()` with no explicit `schemes=` restriction (Django's default allows `http`/`https`/`ftp`/`ftps`). It's inherited by `StlModelLink` (`backend/miniatures/models/stl_model_link.py`), `CharacterLink` (`backend/games/models/character/character_link.py`), and `GameLink` (`backend/games/models/game/game_link.py`).
- `Collection.url`/`Source.url` currently have a custom `#1053` scheme-allowlist validator (`validate_url`, plus control-char-stripping/scheme-extraction regexes) in `CollectionCreateSerializer` (`backend/miniatures/serializers/collection_create.py`) and `SourceCreateSerializer` (`backend/miniatures/serializers/source_create.py`). This deliberately still accepts scheme-less values (bare domains, relative paths) — behavior that a strict `URLField`/`URLValidator` will no longer accept. Per the issue's resolved decision, this custom validation is being **removed** in favor of the model-level validator, and the behavior change (dropping bare-domain/relative-path support) is intentional.
- No data migration/backfill: existing stored values are left untouched (`AlterField` migrations don't re-validate existing rows); the new validators apply only to future writes.
- `Collection`/`Source`/`StlModelLink`/`CharacterLink`/`GameLink` are all tracked by django-simple-history and have matching `Historical*` models under `backend/versioning/migrations/`:
  - `HistoricalCollection` (`backend/versioning/migrations/0026_historicalcollection_historicalcollectionphoto.py`)
  - `HistoricalSource` (`backend/versioning/migrations/0025_historicalsource_photo_historicalsource_url_and_more.py`)
  - `HistoricalStlModelLink`, `HistoricalCharacterLink`, `HistoricalGameLink` (originally defined in `backend/versioning/migrations/0001_initial.py`, later touched by `0014_rename_historicallink_historicalgamelink.py` and `0024_historicalsource_historicalstlmodel_and_more.py`)
  - `HistoricalStlModel`'s own field migration (`backend/versioning/migrations/0031_historicalstlmodel_url_stlmodel_size_and_more.py`) is the direct precedent to mirror for field-level `AlterField` history migrations.
- No `CharacterLinkWriteSerializer`/`GameLinkWriteSerializer`/`StlModelLinkSerializer` define a custom `validate_url` today — they rely purely on the model field's validators, so narrowing `BaseLink.url`'s schemes needs no serializer changes there.

## Implementation Steps

### Step 1 — Convert `Collection.url` to `URLField`

In `backend/miniatures/models/collection.py`, change:
```python
url = models.CharField(max_length=200, unique=True, null=True, blank=True, default=None)
```
to:
```python
url = models.URLField(
    max_length=200, unique=True, null=True, blank=True, default=None,
    validators=[URLValidator(schemes=['http', 'https'])],
)
```
(import `URLValidator` from `django.core.validators`, matching `stl_model.py`'s import). Preserve all existing `null`/`blank`/`unique`/`default` semantics.

### Step 2 — Convert `Source.url` to `URLField`

In `backend/miniatures/models/source.py`, change:
```python
url = models.CharField(max_length=200, blank=True, default='')
```
to:
```python
url = models.URLField(
    max_length=200, blank=True, default='',
    validators=[URLValidator(schemes=['http', 'https'])],
)
```
Preserve existing `blank`/`default` semantics (not nullable/unique, unlike `Collection.url`).

### Step 3 — Narrow `BaseLink.url`'s schemes

In `backend/games/models/base_link.py`, change:
```python
url = models.URLField()
```
to:
```python
url = models.URLField(validators=[URLValidator(schemes=['http', 'https'])])
```
This applies to `StlModelLink`, `CharacterLink`, and `GameLink` via inheritance — no changes needed in the concrete subclass files themselves.

### Step 4 — Generate migrations

Run Django's `makemigrations` for the `miniatures` and `games` apps to produce `AlterField` migrations for:
- `Collection.url` (in `backend/miniatures/migrations/`)
- `Source.url` (in `backend/miniatures/migrations/`)
- `StlModelLink.url` (in `backend/miniatures/migrations/`)
- `CharacterLink.url`, `GameLink.url` (in `backend/games/migrations/`)

Then generate the matching `Historical*` `AlterField` migrations under `backend/versioning/migrations/` for `HistoricalCollection`, `HistoricalSource`, `HistoricalStlModelLink`, `HistoricalCharacterLink`, and `HistoricalGameLink` — mirror the shape of `0031_historicalstlmodel_url_stlmodel_size_and_more.py` (historical field variants typically omit `max_length`/`unique` but carry the same `validators=[...]`). No data migration is needed for any of these — existing rows are left as-is per the issue's resolved decision.

### Step 5 — Remove the superseded `#1053` custom validation

In `backend/miniatures/serializers/collection_create.py` and `backend/miniatures/serializers/source_create.py`, remove the `validate_url` method and its supporting `ALLOWED_URL_SCHEMES`/`_CONTROL_CHARS_RE`/`_SCHEME_RE` definitions — the model-level `URLValidator` now supersedes this logic (same as `StlModelCreateSerializer`/`StlModelUpdateSerializer`, which define no custom `validate_url`).

### Step 6 — Update tests

- `backend/miniatures/tests/serializers/collection_create_test.py` and `backend/miniatures/tests/serializers/source_create_test.py`: remove or rewrite the existing `#1053` test cases that assert bare domains (e.g. `mymminifactory.com`) and relative paths (e.g. `/some/relative/path`) are **accepted** — that behavior is intentionally dropped, so these inputs should now be asserted as **rejected**. Add/extend cases covering rejection of non-http(s) schemes (e.g. `ftp://...`, `javascript:...`) and malformed URLs, following the same assertion style already used for `StlModel.url` validation tests.
- Add or extend model/serializer tests for `Collection`, `Source`, `StlModelLink`, `CharacterLink`, and `GameLink` covering rejection of invalid URLs (non-http/https schemes, malformed values) at the model level (`full_clean()`) and/or serializer level, consistent with how `StlModel.url` is tested.
- Check `backend/games/tests/serializers/characters/character_link_write_test.py` and the equivalent game-link test file (if present) for any existing fixtures using non-http(s)/malformed `url` values that would now fail validation, and update them to use valid `http`/`https` URLs.

## Files to Change

- `backend/miniatures/models/collection.py` — `url` field: `CharField` → `URLField` + validator
- `backend/miniatures/models/source.py` — `url` field: `CharField` → `URLField` + validator
- `backend/games/models/base_link.py` — `url` field: add `validators=[URLValidator(schemes=['http', 'https'])]`
- `backend/miniatures/migrations/XXXX_*.py` (new) — `AlterField` for `Collection.url`, `Source.url`, `StlModelLink.url`
- `backend/games/migrations/XXXX_*.py` (new) — `AlterField` for `CharacterLink.url`, `GameLink.url`
- `backend/versioning/migrations/XXXX_*.py` (new) — matching `AlterField` for `HistoricalCollection.url`, `HistoricalSource.url`, `HistoricalStlModelLink.url`, `HistoricalCharacterLink.url`, `HistoricalGameLink.url`
- `backend/miniatures/serializers/collection_create.py` — remove `#1053` `validate_url`/regex helpers
- `backend/miniatures/serializers/source_create.py` — remove `#1053` `validate_url`/regex helpers
- `backend/miniatures/tests/serializers/collection_create_test.py` — update/replace bare-domain/relative-path acceptance tests; add rejection tests
- `backend/miniatures/tests/serializers/source_create_test.py` — update/replace bare-domain/relative-path acceptance tests; add rejection tests
- Relevant model/serializer test files for `Collection`, `Source`, `StlModelLink`, `CharacterLink`, `GameLink` — add invalid-URL rejection coverage; fix any fixtures using now-invalid `url` values

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/` (CI job: `pytest_all`) and `docker-compose run --rm majora_tests pytest games/tests/views/` (CI jobs: `pytest_views_characters`, `pytest_views_rest`) — covers `games/` and `miniatures/` tests touched by this change.
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`)

## Notes

- This is a deliberate, confirmed behavior change: `Collection.url`/`Source.url` will stop accepting bare domains and relative paths that the #1053 design explicitly allowed. No backend endpoint currently exposes update of `Collection.url`/`Source.url` (only the create serializers set it — no `CollectionUpdateSerializer`/`SourceUpdateSerializer` exists), so the change surface is limited to creation.
- No data backfill/cleanup migration is included — any existing non-conforming stored values are left in place and simply won't be re-validated unless rewritten later.
- `BaseLink.url`'s scheme narrowing is a defense-in-depth/consistency change, not a fix for an active vulnerability — Django's default `URLField` validator already rejects `javascript:` syntactically.
