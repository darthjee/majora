# Issue: Access statistics: Visits endpoint (visits.json)

## Description

Backend endpoint of the access statistics **Visits** tab (#1477): `GET /staff/statistics/visits.json`, returning visits started per time bucket, split into anonymous and logged-in. Spec: `docs/agents/specs/access-statistics/visits.md` (sections [Metrics](../specs/access-statistics/visits.md#metrics), [API](../specs/access-statistics/visits.md#api) and [Edge cases](../specs/access-statistics/visits.md#edge-cases)), built on `docs/agents/specs/access-statistics/shared-infrastructure.md`. Read those sections there instead of a copy here.

The Visits tab is implemented **first** among the tabs: it proves the end-to-end pipeline (shared backend #1498 → frontend shell #1499 → Recharts setup #1500 → this endpoint → Visits UI #1507).

**Dependencies:** #1498 (shared backend: `parse_statistics_filters`, `VisitQuery`, `BucketCalendar`, `Series`, `metrics`) — merged.

**Out of scope:** the Visits tab UI (#1507), a hits series and previous-period comparison (both deferred in the spec).

## Problem

The shared statistics backend exists, but no tab endpoint does yet, so the frontend has no data to chart and the aggregation pipeline (`VisitQuery` → `Series(BucketCalendar)` → reducer) has never been exercised end to end.

## Expected Behavior

- `GET /staff/statistics/visits.json` returns the standard envelope: `filters` (echoed, resolved), `buckets` and `totals`.
- Each bucket has `start` / `end` (inclusive local dates, clipped to the range) and the integer keys `anonymous`, `logged_in` and `visits`; `totals` carries the same three keys.
- A visit counts in the bucket (local day, ISO week or month in `tz`) its `started_at` falls in; `anonymous` / `logged_in` split on `session__user_id` null / not null; `visits == anonymous + logged_in`. No hits.
- Buckets are zero-filled and ordered oldest first. Both audience keys are always present: with `audience=anonymous` every `logged_in` is `0`, and the reverse for `audience=logged_in`.
- Access: `401` anonymous, `403` non-staff, `200` staff, `X-Skip-Cache: true`; invalid params are `400` with the shared error payload; unknown `user` / `domain` ids return zero-filled buckets.

## Solution

- **Aggregation:** `backend/statistics/aggregation/visits_series.py`, `VisitsSeries(filters)` returning `(buckets, totals)`. One query pass: `VisitQuery(filters).rows('started_at', 'session__user_id')`, grouped with `Series(BucketCalendar(filters)).group(rows, lambda row: row[0])`, then `.map(reducer)` where the reducer counts null / non-null user ids with `metrics.count` and returns `{'anonymous', 'logged_in', 'visits'}` (`reducer([])` gives zeros, which zero-fills empty buckets). `totals` sums the buckets. ORM only. Tests in `backend/statistics/tests/aggregation/visits_series_test.py`.
- **View:** `backend/staff/views/staff_statistics_visits.py` (`staff_statistics_visits`), URL name `staff-statistics-visits`, with the shared decorator stack (`@restricted`, `@api_view(['GET'])`, `AllowAny`, inline `require_staff` first), params through `parse_statistics_filters`, no pagination. Thin: it delegates to `VisitsSeries`. Tests in `backend/staff/tests/staff_statistics_visits_test.py`.
- **Tests cover** the edge cases: audience / user / domain combinations (including `user` + `audience=anonymous`), empty ranges, unknown ids, open visits and visits started before `from`, deleted users counted as anonymous, clipped week / month buckets, DST days.
- **Docs:** add the `visits.json` row and endpoint entry to `docs/agents/access-control/staff-statistics.md`; mark the API section as implemented in the spec if it tracks status.
- **Cache:** not added to the Navi warm-up chain.

### Acceptance criteria

- [ ] `visits.json` returns the spec's envelope, bucket keys and types, with tests: 401 anonymous, 403 non-staff, 200 staff, `X-Skip-Cache`, 400 on invalid params.
- [ ] Buckets are zero-filled, oldest first, clipped to the range; both `anonymous` and `logged_in` are always present (zeros for the filtered-out audience).
- [ ] `visits == anonymous + logged_in` on every bucket and in `totals`; `totals` is the sum of the buckets.
- [ ] Not added to the Navi warm-up chain; `staff-statistics.md` updated.
- [ ] `data-access`, `security` and `cache` reviews pass.

## Benefits

Unblocks the Visits tab UI (#1507) and validates the shared aggregation pipeline that every later tab endpoint reuses.
