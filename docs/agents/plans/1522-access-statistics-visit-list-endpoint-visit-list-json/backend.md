# Backend Plan: Access statistics: Visit list endpoint (visit-list.json)

Main plan: [plan.md](plan.md)

## Overview
Implement `visit-list.json` as specified in `docs/agents/specs/access-statistics/visit-list.md` (sections Metrics, Ordering, Filters, API, Edge cases). Reuse the shared building blocks that already landed: `parse_statistics_filters` (strict `page` / `per_page`), `parse_sort` (#1519), `VisitQuery` (#1498), `paginated_list_response` and `Paginator`. Extract the `{id, name, display_name, email}` user identity into a shared serializer that both `users.json` and the new endpoint use.

## Context
- `users.json` (`backend/staff/views/staff_statistics_users.py`) is the closest reference: same decorator stack, `parse_sort` merged into `parse_statistics_filters`, and the same test layout (`backend/staff/tests/staff_statistics_users_test.py`).
- The difference: Users sorts computed metrics in Python. Visit list must sort and slice **in SQL** over an ordered queryset, so `Paginator` / `paginated_list_response` slice the queryset directly.
- `Session.user` and `Session.domain` are `SET_NULL`, so a deleted user leaves `user = NULL`. That row is anonymous and matches `VisitQuery.AUDIENCE_LOOKUPS['anonymous']` with no extra work.
- `Session.token` must never be serialized.

## Steps

- [01 — Extract the shared user identity serializer](backend/01-shared-user-identity-serializer.md)
- [02 — Add the VisitList aggregation](backend/02-visit-list-aggregation.md)
- [03 — Add the visit row serializer](backend/03-visit-row-serializer.md)
- [04 — Add the visit-list.json view and URL](backend/04-visit-list-view.md)
- [05 — Document access control](backend/05-access-control-doc.md)

## CI Checks
- `backend`: `make` / `docker-compose` wrappers for `cd backend && poetry run pytest --cov` and `poetry run ruff check .` (CI jobs: `pytest_views_rest`, `pytest_all`, `checks`). Never run them on the host; see AGENTS.md.

## Notes
- The endpoint must not be added to the Navi warm-up chain (`navi/`). The `cache` agent only reviews this; no Navi files change.
- Reviews by `data-access`, `security` and `cache` must pass (new endpoint exposing raw IPs, statistics session ids and user identities to staff).
- Run against MySQL (as CI does): the `duration` sort subtracts two `DateTimeField`s. Django supports this on MySQL with `ExpressionWrapper(..., output_field=DurationField())`, but cover it with a test that runs through the database, not a mock.
- Rows are not grouped, so `UsersRanking`'s `_RankedRows` is not needed: pass the queryset itself to the paginator.
