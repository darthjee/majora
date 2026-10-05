# Issue: Access statistics: Domains summary endpoint (domains/summary.json)

## Description
Backend endpoint of the access statistics **Domains** tab (#1477): `GET /staff/statistics/domains/summary.json`, a per-domain comparison over the whole filtered range. The full spec is `docs/agents/specs/access-statistics/domains.md` (specced in #1487), built on `docs/agents/specs/access-statistics/shared-infrastructure.md`. This issue implements its **Metrics**, **Filters** (row selection) and **API** sections; read them there rather than a copy here. The frontend counterpart is #1517.

Depends on #1498 (shared backend), which is already merged: `VisitQuery` (`rows`, `visitor_key`), `metrics` (`count`, `unique`, `average`, `median`, `duration_seconds`), `StatisticsFilters.UNKNOWN_DOMAIN`, `parse_statistics_filters` and `statistics_envelope(filters, totals=..., **extra)` all exist.

## Problem
The Domains tab has no data source. The existing `staff/statistics/domains.json` is the shared filter-options support endpoint and must not be reused or changed: the tab needs its own metrics endpoint, with every configured domain plus an "unknown" row.

## Expected Behavior
- `GET /staff/statistics/domains/summary.json` returns the standard envelope: `filters`, `totals` and a `domains` list (no `buckets`).
- Each row has `id` (`Domain.id`, or `"unknown"`), `domain` (hostname, or `null`), `group` (`DomainGroup.name`, or `null`) and six metrics: `visits`, `anonymous`, `logged_in`, `unique_visitors`, `average_duration_seconds`, `median_duration_seconds`. Durations are rounded integers, `null` on zero-visit rows.
- `totals` carries the same six metrics computed over **all** matched visits (not summed from the rows). `totals.visits`, `totals.unique_visitors` and `totals.average_duration_seconds` match Overview, and `totals.median_duration_seconds` matches Duration, for the same filters. Per-row `unique_visitors` may add up to more than the total.
- Rows are ordered by `visits` desc, then `domain` asc; "unknown" is always last.
- Row selection by the `domain` filter:
  - omitted: every configured `Domain` (zero-filled), plus the unknown row (always present, even with zero visits);
  - `<id>` of an existing domain: that row only (zero-filled if no visits);
  - `<id>` with no `Domain` row: an empty `domains` list and zero totals;
  - `unknown`: the unknown row only.
- `granularity` is accepted, validated and echoed, but ignored. The other shared filters (range, `user`, `audience`) apply as on every tab. With `audience=anonymous` every `logged_in` is `0`, and vice versa.
- Access: `401` anonymous, `403` non-staff, `200` staff, `X-Skip-Cache: true` header, `400` on invalid params.

## Solution
- **Aggregation**: `backend/statistics/aggregation/domains_summary.py` defines `DomainsSummary(filters)`, which returns `(domains, totals)` and is exported from `statistics.aggregation`.
  - One `VisitQuery(filters).rows('session__domain_id', 'session_id', 'session__user_id', 'started_at', 'last_seen_at')` pass, grouped by `session__domain_id` in Python (`None` → unknown).
  - One `Domain.objects.select_related('domain_group')` query, filtered to `id=filters.domain` when it is an id and skipped when it is `unknown`.
  - A single reducer turns a list of rows into the six metrics, using `metrics.count` / `unique` / `average` / `median` and `VisitQuery.visitor_key`. `reducer([])` gives `0` counts and `null` durations, which zero-fills rows. `totals` is the same reducer over all rows.
  - The unknown row is appended when the domain filter is unset or `unknown`; then rows are sorted.
  - ORM only, no raw SQL.
  - Tests go in `backend/statistics/tests/aggregation/domains_summary_test.py`. They cover the unknown row, deleted domains (`SET_NULL` → unknown, so the old id gives an empty list), visitors on several domains, deleted users counting as anonymous, open and single-hit visits, visits started before `from`, and `user` / `audience` combinations (including `user` + `audience=anonymous` giving zero rows).
- **View**: `backend/staff/views/staff_statistics_domains_summary.py` (`staff_statistics_domains_summary`), with the same decorator stack as `staff_statistics_overview` (`@restricted`, `@api_view(['GET'])`, `@permission_classes([AllowAny])`, inline `require_staff` first). It runs `parse_statistics_filters` and responds with `statistics_envelope(filters, totals=totals, domains=domains)`. It is registered in `backend/staff/urls.py` as `staff/statistics/domains/summary.json`, name `staff-statistics-domains-summary`, and exported from `staff/views`. Tests go in `backend/staff/tests/staff_statistics_domains_summary_test.py`.
- **Docs**: add the `domains/summary.json` row to `docs/agents/access-control/staff-statistics.md`, and mark #1516 done in the spec where applicable.
- **Not** added to the Navi warm-up chain. No proxy change.
- **Out of scope**: the Domains tab UI (#1517), a time series per domain, a `DomainGroup` rollup and previous-period comparison (all deferred).
- **Reviews**: `data-access`, `security` and `cache` reviews must pass.

## Benefits
Staff can compare traffic, audience mix, reach and engagement across the configured domains (and spot unrecognized-host traffic through the "unknown" row). This unblocks the Domains tab frontend (#1517).
