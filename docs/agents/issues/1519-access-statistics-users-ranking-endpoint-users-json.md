# Issue: Access statistics: Users ranking endpoint (users.json)

## Description
Backend endpoint for the access statistics **Users** tab (#1477). It ranks logged-in users by visits and time on site and shows when each was last seen. The spec is `docs/agents/specs/access-statistics/users.md` (written in #1488), built on `docs/agents/specs/access-statistics/shared-infrastructure.md`. This issue implements the spec sections named below. Read them in the spec rather than relying on a copy here.

Depends on #1498 (shared backend: `VisitQuery`, `StatisticsParamsParser`, `metrics`), which is closed. The frontend tab is #1520.

## Problem
The Users tab has no backend: no endpoint returns per-user visit metrics, so the frontend tab (#1520) has nothing to render.

## Expected Behavior
- [ ] `GET /staff/statistics/users.json` returns the spec's row keys and types with the `page` / `pages` / `per_page` / `total` headers. Tests cover: 401 for anonymous, 403 for non-staff, 200 for staff, `X-Skip-Cache`, and 400 on invalid params, including `invalid_sort` reported together with the shared errors (e.g. bad `sort` plus bad `tz` returns both keys).
- [ ] Every `sort` key orders rows descending, ties broken by user id ascending, and the order stays stable across pages.
- [ ] `audience=anonymous` gives an empty list. `user=<id>` gives at most one row, and an unknown id gives an empty list. The `domain` filter limits both the counted visits and each row's `domains`.
- [ ] Not added to the Navi warm-up chain. `docs/agents/access-control/staff-statistics.md` gets the `users.json` row.
- [ ] `data-access`, `security` and `cache` reviews pass.

## Solution
**API** (spec "API"): `GET /staff/statistics/users.json` in `backend/staff/views/staff_statistics_users.py` (`staff_statistics_users`), URL name `staff-statistics-users`, tests in `backend/staff/tests/staff_statistics_users_test.py`.
- Shared decorator stack: `@restricted`, `@api_view(['GET'])`, `AllowAny`, with inline `require_staff` first.
- Shared params and validation through `StatisticsParamsParser` (it already parses `page` / `per_page` strictly), plus the tab's `sort`. Every error is returned at once, so the `sort` error must be merged into the parser's errors before the `400` is built. `parse_statistics_filters` currently builds the Response itself, so it needs a small extension, or a sibling helper in `staff/views/_staff_statistics_shared.py`, that accepts extra errors.
- Response: a plain JSON array of rows with the shared `Paginator` headers. No envelope, no totals, and `sort` is not echoed. The view calls `Paginator` itself (not `paginated_list_response`), because identities are merged in after slicing.

**Metrics** (spec "Metrics"): one row per logged-in user with at least one matched visit.
- `visits`, `time_on_site_seconds`, `average_duration_seconds` (rounded `metrics.average`), `hits`, and `last_seen_at` (ISO 8601 UTC, `Z`).
- `domains`: `[{ "id", "domain" }]` in hostname order, with `{ "id": "unknown", "domain": null }` last.
- Identity keys `id`, `name`, `display_name`, `email`, the same keys as `StaffUserListSerializer`.

**Ordering** (spec "Ordering"): `sort` takes `visits` (default), `time_on_site`, `average_duration`, `hits` or `last_seen`. It is always descending, with ties broken by user id ascending. Any other value, including an empty `sort=`, returns `400` with `{"errors": {"sort": ["invalid_sort"]}}`.

**Filters** (spec "Filters"): date range, `user`, `domain` and `audience` use the shared semantics. `granularity` is accepted, validated and ignored. `audience=anonymous` gives an empty list without querying anything else.

**Aggregation:** `statistics/aggregation/users_ranking.py` holds `UsersRanking(filters, sort)`, tested in `statistics/tests/aggregation/`.
- One `VisitQuery(filters).queryset()` pass, narrowed to `session__user__isnull=False`, with a `values_list` of user, domain id/hostname, `started_at`, `last_seen_at` and `hits`. Rows are grouped and reduced per user in Python, then sorted.
- It returns a small sequence wrapper that exposes a no-arg `count()` and slicing, so the shared `Paginator` works unchanged (a plain `list` does not, because `list.count` needs an argument).
- The view then runs one `User.objects.select_related('profile').filter(id__in=...)` query for the page's ids. No raw SQL.

**Edge cases** (spec "Edge cases"):
- Deleted users are never listed (their sessions have `user = NULL`).
- A user on several domains or devices gets one row, with each domain listed once.
- Open visits count with their current duration. A single-hit visit has duration 0.
- Visits that started before `from` are excluded.
- Login is a visit boundary: the login request counts on the anonymous visit.
- A page past the last one returns an empty list with the headers.

**Access control:** add the `users.json` row to `docs/agents/access-control/staff-statistics.md`, noting that it exposes user id, username, display name and email to staff, as `staff/users.json` already does.

**Out of scope:** the Users tab UI (#1520), a chart, previous-period comparison, CSV export and ascending sort (all deferred).
