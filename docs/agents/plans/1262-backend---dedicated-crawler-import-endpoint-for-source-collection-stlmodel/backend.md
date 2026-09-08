# Backend Plan: Backend — dedicated crawler-import endpoint for Source/Collection/StlModel

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add external_id fields and migration](backend/01-add-external-id-fields.md)
- [02 — Source/Collection find-or-create sync](backend/02-source-collection-sync.md)
- [03 — StlModel import serializer](backend/03-stl-model-import-serializer.md)
- [04 — Import endpoint view and URL](backend/04-import-endpoint-view.md)
- [05 — Document the new endpoint](backend/05-update-docs.md)

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — `miniatures` app tests run under this job.

## Notes

- `Collection.name` is globally unique and `Collection.source` is an optional (nullable) FK — the
  import endpoint intentionally matches `Collection` globally (not scoped by `Source`) and always
  (re)assigns `source` to whichever `Source` the current request resolved, even overwriting a
  different prior value. A same-named `Collection` reused across two different sources would have
  its `source` silently reassigned to whichever source is imported last — accepted as a known
  limitation while Lootstudios is the only source (see the issue's "Explicitly out of scope").
- `external_id` is a bare `unique=True` column with no source-scoping/namespacing — same
  known-limitation category, deferred for the same reason.
- The request body is a single JSON object — no array/batch support. The crawler calls this
  endpoint once per `StlModel`.
- `StlModel.sources`/`StlModel.collections` are `ManyToMany` fields (not single FKs) — the
  resolved `Source`/`Collection` are added to those M2Ms, not assigned via `source_id`/`collection_id`.
- Reviewed by `security` and `data-access` per the issue's acceptance criteria (new write
  endpoint, new implicit-creation behavior, new unique fields) — flag for review once implemented,
  no plan step needed since both are read-only reviewers.
