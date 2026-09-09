# Backend Plan: Backend — standalone Collection upsert endpoint for crawler import (Lootstudios)

Main plan: [plan.md](plan.md)

## Overview

Add `POST /miniatures/collections/import.json`, matching `stl_models/import.json`'s (#1262) auth, upsert precedence (`external_id` then `name`), and response convention (`201` created / `200` found), with request fields `name` (required), `external_id` (optional/unique/nullable), `url` (optional), `source_name` (required). Relax `CollectionSync` (`backend/miniatures/serializers/_crawler_import_sync.py`) so creating a `Collection` from `external_id` alone (no `name`) no longer raises an `IntegrityError`, and so a later `collections/import.json` call can fill in a stub's real `name`/`url`.

## Context

- Existing precedent: `backend/miniatures/views/stl_model_import.py` (view), `backend/miniatures/serializers/stl_model_import.py` (`StlModelImportSerializer`), `backend/miniatures/urls/stl_models.py` (route), all reusing `require_staff`/`validated_or_error` from `backend/games/views/common.py`.
- `CollectionSync` (`_crawler_import_sync.py:22-68`) already does `_find()` (by `external_id` then `name`) → `_create()` or `_reassign_source()`. `_create()` (lines 58-62) calls `Collection.objects.create(source=..., external_id=..., name=...)`, which raises `IntegrityError` today if `name=None` since `Collection.name` (`backend/miniatures/models/collection.py`) is `CharField(max_length=200, unique=True)` with no `null=True`.
- `_reassign_source()` only ever updates `source` on a match — it never touches `name`/`url`. This endpoint needs matched Collections to also pick up `name`/`url` from the payload (so a stub created via `collection_external_id` gets filled in later), without changing `stl_models/import.json`'s existing behavior (which never sends `url` and only conditionally sends `name`).
- Migration precedent: `backend/miniatures/migrations/0008_collection_external_id_stlmodel_external_id.py` added `external_id` as `null=True, blank=True, unique=True, default=None` on both `Collection`/`StlModel`. **Decision: do not add a migration.** Instead, fall back to a placeholder name (the given `external_id`) inside `CollectionSync._create()` when no `name` is given at creation time — this is a self-contained change to `_crawler_import_sync.py` with no model/migration/`__str__`/serializer/admin impact, versus a nullable-`name` migration which would additionally require a `Collection.__str__` fallback and change the API-visible nullability of `name` in `CollectionDetailSerializer`/`CollectionListSerializer` for no functional gain (the stub is always transient by design — the issue's own acceptance criteria expect it filled in by a later call).
- Docs precedent: `docs/guides/majora/miniatures.md` — `### POST /miniatures/stl_models/import.json` at line 238 (heading, prose, fenced request-body JSON with inline field comments, bullet list of behaviors, `Response` paragraph). The `## Collections` section runs from line 15–98; new endpoint doc goes after `### GET /miniatures/collections/<id>.json` (line 56) and before `### POST /miniatures/collections/<id>/photo_upload.json` (line 72), mirroring where `stl_models/import.json` sits relative to STL Models' CRUD/photo-upload endpoints.
- Test precedent: `backend/miniatures/tests/views/stl_model_import_test.py` (`TestStlModelImportView(TokenAuthRequestMixin)`, `@pytest.mark.django_db`, `setup_method` builds superuser/staff/regular users + tokens), `backend/miniatures/tests/serializers/stl_model_import_test.py` (`TestStlModelImportSerializer`, inline data per test), `backend/miniatures/tests/serializers/_crawler_import_sync_test.py` (`TestSourceSync`/`TestCollectionSync`, uses `CollectionFactory`/`SourceFactory` from `miniatures.tests.factories`).

## Steps

- [01 — Relax CollectionSync](backend/01-relax-collection-sync.md)
- [02 — Add CollectionImportSerializer](backend/02-add-collection-import-serializer.md)
- [03 — Add the view and route](backend/03-add-collection-import-view-and-route.md)
- [04 — Add tests](backend/04-add-tests.md)
- [05 — Document the endpoint](backend/05-document-endpoint.md)

## CI Checks

- `backend`: `docker-compose run backend poetry run pytest miniatures/` (CI job: `pytest_all`)

## Notes

- Placeholder-name fallback must still be globally unique (collides under `Collection.name`'s `unique=True`) — using the given `external_id` verbatim as the placeholder is safe since `external_id` is itself unique, but confirm no existing `Collection.name` could already equal some other row's `external_id` (extremely unlikely given `external_id` values are Lootstudios-specific identifiers, but worth a defensive `_find()`-by-name check inside `_create()` if paranoid — not required by the issue's acceptance criteria).
- `source_name` is required by this new endpoint's request body — unlike `stl_models/import.json` where `collection_name`/`collection_external_id` are optional sub-fields, `collections/import.json`'s top-level `source_name` should be validated as required by the new serializer, consistent with `StlModelImportSerializer`'s own top-level `source_name` requirement (confirm exact field name/requiredness against that serializer directly while implementing).
- Explicitly out of scope per the issue: the Navi configuration wiring the crawler to call this endpoint (#1263), and any change to `stl_models/import.json`'s own request/response contract beyond the `CollectionSync` relaxation above.
- Review: `security`, `data-access` (per the issue's `Owned by` line) — expect their read-only review during the PR/implementation phase, not during this planning phase.
