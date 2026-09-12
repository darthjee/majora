# Issue: Backend: miniatures import endpoints return 200 on create as well as update

## Description
Part of #1291 (the Lootstudios Enqueue feature). The Lootstudios crawler imports catalog items into Majora via two crawler-import endpoints:
- `POST /miniatures/collections/import.json` (#1281, `backend/miniatures/views/collection_import.py`)
- `POST /miniatures/stl_models/import.json` (#1262, `backend/miniatures/views/stl_model_import.py`)

#1291 adds a Navi extension page that enqueues a real Navi queue job to crawl **one** collection on demand, which routinely imports brand-new collections/models — i.e. hits the create path of these endpoints for the first time.

## Problem
Both import endpoints currently return **201 on create**, 200 on update, driven by `serializer.created`. Navi's `emit.status` is a single integer, and `crawler/navi_config.yaml` (plus the per-collection resource template from #1291's sub-issues) sets it to `200`. So the first import of any **new** collection/model returns 201, which Navi treats as a **failed emit**: it retries `max-retries` times, then dead-letters the job. The Enqueue UI targets fresh collections, so this fires on essentially every first run.

Confirmed in the current code (`backend/miniatures/views/collection_import.py` and `stl_model_import.py`):
```python
status = 201 if serializer.created else 200
return skip_cache(Response(detail.data, status=status))
```
and the existing view tests explicitly assert 201 on create (`backend/miniatures/tests/views/collection_import_test.py::test_returns_201_on_create`, and the equivalent stl_model test).

## Expected Behavior
Both `collection_import` and `stl_model_import` views return **200 on create as well as update**. Response bodies (`CollectionDetailSerializer` / `StlModelDetailSerializer`) and the `skip_cache(...)` wrapper stay unchanged. Auth (`IsAuthenticated` + `require_staff`, i.e. staff or admin) is unchanged.

## Solution
Drop the `serializer.created`-driven status branch in both views so the response is always `200`, e.g.:
```python
return skip_cache(Response(detail.data, status=200))
```

Alternative considered: change `emit.status` crawler-side instead — rejected because Navi's `emit.status` is a single int with no 2xx range, so the backend fix is the clean one and keeps `emit.status: 200` valid for both the whole-catalog config and the per-collection template.

**Tests** (`backend/miniatures/tests/views/collection_import_test.py`, `backend/miniatures/tests/views/stl_model_import_test.py`): update `test_returns_201_on_create` (rename/adjust to assert 200) so a `POST` import that **creates** a brand-new `Collection`/`StlModel` returns 200; `test_returns_200_on_update` stays 200 as-is; unauthenticated → 401 and non-staff → 403 stay unchanged. Runs under the existing `pytest_all` CircleCI job; ruff line length 100.

**Files**: `backend/miniatures/views/collection_import.py`, `backend/miniatures/views/stl_model_import.py`, `backend/miniatures/tests/views/collection_import_test.py`, `backend/miniatures/tests/views/stl_model_import_test.py`.

Owner: **backend**. Can proceed independently of #1291's other sub-issues; blocks that issue's end-to-end verification.

## Benefits
The Enqueue UI's first-run imports of brand-new collections/models stop being misread by Navi as failed emits, so they no longer get retried `max-retries` times and dead-lettered — the on-demand crawl job succeeds on the first pass instead of always failing once per new collection.
