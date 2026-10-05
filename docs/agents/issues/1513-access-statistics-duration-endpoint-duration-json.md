# Issue: Access statistics: Duration endpoint (duration.json)

## Description

Backend endpoint for the **Duration** tab of the access statistics page (epic #1477). The full spec is in `docs/agents/specs/access-statistics/duration.md` (written in #1486) and builds on `docs/agents/specs/access-statistics/shared-infrastructure.md`. This issue implements the spec sections **Metrics**, **Histogram**, **API** and **Edge cases**. Read them in the spec; they are not copied here.

The dependency #1498 (shared backend: `VisitQuery`, `BucketCalendar`, `Series`, `parse_statistics_filters`, `metrics.median` / `metrics.histogram`) is closed, so all building blocks already exist in `backend/statistics/aggregation/`.

## Problem

The Duration tab (#1514) has no data source. Visit duration and hits per visit are tracked on `Visit` (#1478), but no endpoint exposes them over time, and Overview only returns a single average duration.

## Expected Behavior

- `GET /staff/statistics/duration.json` returns the standard envelope (`filters`, `buckets`, `totals`) plus a top-level `histogram`. The exact shape and types are in the spec's **API** section.
- Every bucket and `totals` contain `visits`, `single_hit_visits`, `average_duration_seconds`, `median_duration_seconds`, `average_hits` and `median_hits`.
  - Empty buckets have `0` counts and `null` averages / medians.
  - Visits are bucketed by the bucket they **started** in.
  - Single-hit visits (duration `0`) count in the average and the median.
- `totals` is computed over all matched visits, never from bucket values. So `totals.visits` and `totals.average_duration_seconds` equal Overview's `visits` and `average_duration_seconds` for the same filters.
- `histogram` has eight `{lower, upper, count}` bins over the whole range, edges `[0, 1, 30, 60, 180, 600, 1800, 3600]`. The last bin has `upper: null`, and the counts sum to `totals.visits`.
- Access: `401` for anonymous users, `403` for non-staff users, `200` for staff, `X-Skip-Cache: true` on responses, and `400` on invalid params.

## Solution

- **View:** `backend/staff/views/staff_statistics_duration.py` (`staff_statistics_duration`), URL name `staff-statistics-duration`, tests in `backend/staff/tests/staff_statistics_duration_test.py`. It uses the same decorator stack as the other statistics views (`@restricted`, `@api_view(['GET'])`, `AllowAny`, inline `require_staff` first) and the shared `parse_statistics_filters`. There are no pagination params.
- **Aggregation:** `backend/statistics/aggregation/duration_series.py`, where `DurationSeries(filters)` returns `(buckets, totals, histogram)`. Tests go in `backend/statistics/tests/aggregation/duration_series_test.py`.
  - It makes one pass with `VisitQuery(filters).rows('started_at', 'last_seen_at', 'hits')`.
  - Buckets come from `Series(BucketCalendar(filters)).group(rows, ...).map(reducer)`. The same reducer is applied to all rows for `totals`.
  - `histogram` is `metrics.histogram` over all durations.
- **Rounding:** follow the spec. Durations are rounded to integers, `average_hits` to one decimal, and `median_hits` keeps the `.5`.
- **Same duration as Overview:** per-visit duration must use the same definition as Overview: `int((last_seen_at - started_at).total_seconds())`, then `round()` on the average. That definition currently lives in the private `OverviewTotals._duration_seconds` (`backend/statistics/aggregation/overview_totals.py`). Move it to a shared helper that both classes use, so the two endpoints cannot drift apart.
- **Edge-case tests:** empty ranges, open visits (current duration), visits started before `from`, even-count medians (durations rounded, hits keep `.5`), `user` / `domain` / `audience` combinations, deleted users, clipped first and last buckets with week / month granularity, and DST days.
- **Docs:** add the `duration.json` row to `docs/agents/access-control/staff-statistics.md`.
- **Navi:** do not add the endpoint to the Navi warm-up chain.

### Out of scope

The Duration tab UI (#1514), previous-period comparison, an audience split, configurable or per-bucket histogram bins, and percentiles beyond the median. These are deferred in the spec.

### Acceptance criteria

- [ ] `duration.json` returns the envelope, bucket keys, histogram and types from the spec, with tests for: `401` anonymous, `403` non-staff, `200` staff, `X-Skip-Cache`, and `400` on invalid params.
- [ ] Buckets are zero-filled, oldest first and clipped to the range. Empty buckets have `visits: 0`, `single_hit_visits: 0` and `null` averages / medians.
- [ ] The histogram always has the eight bins, and their counts sum to `totals.visits`.
- [ ] `totals.visits` and `totals.average_duration_seconds` match Overview for the same filters, and a test shows it.
- [ ] Per-visit duration is computed by one shared helper used by both Overview and Duration.
- [ ] The endpoint is not in the Navi warm-up chain, and `staff-statistics.md` is updated.
- [ ] The `data-access`, `security` and `cache` reviews pass.

## Benefits

Unblocks the Duration tab (#1514). Staff get average and median visit duration and hits per visit over time, plus how visit lengths are distributed, and these numbers stay consistent with Overview.
