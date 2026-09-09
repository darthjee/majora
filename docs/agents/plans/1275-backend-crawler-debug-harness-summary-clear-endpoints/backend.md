# Backend Plan: Backend — crawler debug harness summary + clear endpoints

Main plan: [plan.md](plan.md)

## Overview

Two new endpoints, both mirroring the existing memory-cache clear/summary pair
(`backend/staff/views/staff_cache_clear.py`, `staff_cache_summary.py`):

- `GET /staff/crawler/summary.json` — its own thin view (`staff_crawler_summary`)
  on a new route, backed by a dedicated `CrawlerDebugEmissionSummary` builder
  class that runs the per-`type` aggregation.
- `DELETE /staff/crawler.json` — its own view function (`staff_crawler_clear`),
  re-exported and unit-tested. Because Django resolves exactly one view per URL
  string, the live route keeps pointing at the existing `staff_crawler` view;
  that view gains a `DELETE` branch which delegates to a plain
  `clear_crawler_emissions()` helper shared with `staff_crawler_clear`.

No model, migration, serializer, or paginator changes. The whole harness
(model, migration, endpoints, spec, access-control doc) is deleted once #1262's
real import endpoint is trusted end-to-end, so keep every addition minimal and
obviously temporary.

## Context

- `CrawlerDebugEmission` (`backend/staff/models/crawler_debug_emission.py`):
  fields `created_at`, `source` (`CharField(100)`), `type` (`CharField(100)`,
  **no choices** — free text), `payload` (`JSONField`). `Meta.ordering = ['id']`.
- `staff_crawler` (`backend/staff/views/staff_crawler.py`): `@restricted` /
  `@api_view(['GET', 'POST'])` / `@permission_classes([AllowAny])`, inline
  `require_staff` guard, then dispatches by method. No serializer — records are
  hand-built as dicts.
- Route today: `path('staff/crawler.json', views.staff_crawler, name='staff-crawler')`
  in `backend/staff/urls.py`. Precedent pair is registered as two separate
  paths/views: `staff/cache.json` → `staff_cache_clear`, `staff/cache/summary.json`
  → `staff_cache_summary`.
- Access-control doc: `docs/agents/access-control/staff-crawler.md` (indexed from
  `docs/agents/access-control.md`). The staff-cache pair is **not** listed in
  `docs/agents/access-control/endpoints.md`, so matching precedent means no new
  row there either.
- Tests live in `backend/staff/tests/` (outside `games/tests/views/`), so they
  run under the `pytest_all` CI job. Convention (see `staff_cache_summary_test.py`,
  `staff_cache_clear_test.py`, `staff_crawler_test.py`): `@pytest.mark.django_db`
  class, `setup_method` building `staff_user`/`superuser`/`regular_user` +
  `Token`s, private `_get`/`_post`/`_delete` request helpers, a standard access
  matrix (`401` anon, `403` non-staff, staff-can, superuser-can), an
  `X-Skip-Cache` header assertion, and a `reverse(...)` URL-by-name test.

## Steps

- [01 — Summary endpoint + builder class](backend/01-summary-endpoint.md)
- [02 — Clear endpoint + DELETE delegation](backend/02-clear-endpoint.md)
- [03 — Access-control doc](backend/03-access-control-docs.md)
- [04 — Tests](backend/04-tests.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest staff/tests/` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` — max line length 100 (CI job: `checks`)
- `backend`: `bin/reports.sh ci` — Python complexity report (CI job: `checks`)
- docs: `yarn lint_md` — for the `staff-crawler.md` edit (CI job: `markdownlint`)

## Notes

- The summary aggregation **must** call `.order_by()` (empty) before
  `.annotate(...)` to drop the model's default `Meta.ordering = ['id']`;
  otherwise `id` is injected into the `GROUP BY` and every row counts as 1.
- `type` is free text — the summary reports whatever distinct strings are
  present (e.g. also an unexpected `"foo"`); do not filter to an expected set.
  Empty table → `{}`.
- `staff_crawler_clear` is re-exported from `views/__init__.py` and unit-tested
  even though no URL routes to it directly — this is the deliberate decision
  recorded in the issue. A second `path('staff/crawler.json', ...)` entry must
  **not** be added (Django would never reach it).
- Keep `staff_crawler`'s view body thin (AGENTS.md: "keep backend views thin").
  The shared delete is a one-liner helper, `clear_crawler_emissions()`; the
  per-`type` reshape goes in `CrawlerDebugEmissionSummary`, not the view.
- No changes to `navi/` cache config: both endpoints are `@restricted`
  (`X-Skip-Cache: true`), so the cache warmer does not index them.
