# Backend Plan: Access statistics: shared backend (aggregator, API conventions, domains endpoint)

Main plan: [plan.md](plan.md)

## Overview

Implement the "Granularity and range cap", "API conventions" and "Python aggregator" sections
of [`docs/agents/specs/access-statistics/shared-infrastructure.md`](../../specs/access-statistics/shared-infrastructure.md). That spec is the source of
truth for names, signatures, validation codes and the envelope shape. Follow it exactly rather
than re-deriving it.

## Context

- `backend/statistics/` holds only the tracking side today (`Session`, `Visit`, middleware,
  cookies, `Settings`). There is no `aggregation/` package yet.
- `Visit` has a `started_at` index. `Session.user` and `Session.domain` are nullable FKs.
- `Domain` (`backend/domains/models.py`) has a unique, lowercased `domain` field.
- Staff endpoint pattern: `backend/staff/views/staff_cache_summary.py` (decorators) and
  `staff_users_list.py` (the `(value, error_response)` tuple style and 400
  `{"errors": {...}}` shape). `require_staff` lives in `games/views/common.py`.
- **Naming trap:** the app is called `statistics`, which shadows the stdlib module. Never
  `import statistics` for `median` / `mean`.

## Steps

- [01 — Range cap setting](backend/01-range-cap-setting.md)
- [02 — Aggregation core: granularity, filters, params parser](backend/02-filters-and-params-parser.md)
- [03 — Aggregation: bucket calendar, visit query, series, metrics](backend/03-bucketing-and-metrics.md)
- [04 — Shared view helper and domains endpoint](backend/04-shared-helper-and-domains-endpoint.md)
- [05 — Access-control doc sync](backend/05-access-control-doc.md)

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_rest`,
  `pytest_all`)
- `backend/`: `ruff check .` and the complexity report `bin/reports.sh ci` (CI job: `checks`)
- `docs/`: markdownlint (CI job: `markdownlint`)

## Notes

- Do not add the endpoint to `navi/`: it is restricted and never warmed. The `cache` agent
  only reviews this.
- `docs/agents/permissions.yaml` needs no change (the staff role's `scope: staff` covers it).
- Keep functions small: the `checks` job enforces complexity limits, so split the params parser
  into one private method per param.
- Tab endpoints (#1483 to #1489), the frontend (#1499, #1500) and the client IP fix (#1501) are
  out of scope.
