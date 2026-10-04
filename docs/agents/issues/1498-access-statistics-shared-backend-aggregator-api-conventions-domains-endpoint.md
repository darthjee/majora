# Issue: Access statistics: shared backend (aggregator, API conventions, domains endpoint)

## Description

Shared backend infrastructure for the access statistics page (#1477), the first implementation sub-issue specced by #1482. The authoritative spec is `docs/agents/specs/access-statistics/shared-infrastructure.md`. This issue implements its "Granularity and range cap", "API conventions" and "Python aggregator" sections. Read them there instead of a copy here.

## Problem

Every statistics tab endpoint (#1483 to #1489) needs the same filter parsing, validation, time-zone-aware bucketing, zero-filling and metric helpers. None of this exists yet: `backend/statistics/` has only the tracking side (models, middleware, cookies, settings). No endpoint lists `Domain` rows for the filter bar either. The frontend shell (#1499) depends on this issue.

## Expected Behavior

- **Aggregator package** `backend/statistics/aggregation/` (plain classes, one per file, like `games/caches/`):
  - `filters.py`: `StatisticsFilters` frozen dataclass with `start_utc` / `end_utc` (half-open UTC interval) and `as_dict()` (the envelope `filters` echo).
  - `params_parser.py`: `StatisticsParamsParser(query_params, today=None)`. `parse()` returns `(filters, errors)`, enforces every rule in the spec's Validation table and reports every error at once.
  - `granularity.py`: `Granularity` with `DAY` / `WEEK` / `MONTH` / `AUTO`, `DAY_MAX_DAYS = 31`, `WEEK_MAX_DAYS = 186` and `resolve(...)`.
  - `bucket_calendar.py`: `BucketCalendar(filters)` with `buckets()` (ordered, clipped to the range) and `key_for(aware_dt)`. Buckets are DST-correct local calendar days, ISO weeks (Monday start) or months.
  - `visit_query.py`: `VisitQuery(filters)` with `queryset()` (ORM only), `rows(*fields)` (`values_list`) and the static `visitor_key(user_id, session_id)`.
  - `series.py`: `Series(calendar)` with `group(rows, timestamp_of)` and `map(reducer)`, which zero-fills with `reducer([])`.
  - `metrics.py`: pure `count`, `unique`, `average` / `median` (`None` on empty input; the even-length median is the mean of the two middle values) and `histogram(values, edges)`.
  - Never `import statistics` from the stdlib: the app name shadows it.
- **Range cap setting:** `statistics.settings.Settings.max_range_days()` (env `MAJORA_STATISTICS_MAX_RANGE_DAYS`, default `366`), following the existing static-method pattern.
- **Shared view helper** `backend/staff/views/_staff_statistics_shared.py`:
  - `parse_statistics_filters(request)` returns `(filters, error_response)`, where the error response is a 400 with `{"errors": {"<field>": ["<code>"]}}`;
  - a response-envelope builder (`filters` / `buckets` / `totals`), so tab endpoints only add their payload.
- **Domain filter endpoint** `GET /staff/statistics/domains.json`:
  - returns `[{"id", "domain"}]` ordered by `domain`, unpaginated, and takes no filter params;
  - uses the same decorator stack as `staff_cache_summary.py`: `@restricted`, `@api_view(['GET'])`, `@permission_classes([AllowAny])`, then `require_staff` as the first statement;
  - lives in `staff/views/staff_statistics_domains.py`, registered in `staff/urls.py` as `staff-statistics-domains`;
  - is not added to the Navi warm-up chain.
- **Access-control doc:** `docs/agents/access-control/staff-statistics.md` matches what ships. Drop the "planned" status for the shared endpoint.

## Solution

Backend-only work (`backend` agent), with the `data-access`, `security` and `cache` agents reviewing:

- Tests mirror the package in `backend/statistics/tests/aggregation/<module>_test.py`. They cover a DST day, ISO week clipping at both range edges, zero-filling, empty median/average, histogram edges (values below the first edge, the open last bin) and every validation code, including several errors at once and range checks skipped when a date fails to parse.
- `backend/statistics/tests/settings_test.py` covers `max_range_days()` (default and env override).
- `backend/staff/tests/staff_statistics_domains_test.py` covers 401 anonymous, 403 non-staff (including a DM), 200 staff with the expected order and shape, and the `X-Skip-Cache` header.

### Out of scope

- Tab endpoints (#1483 to #1489 specify them)
- All frontend work (#1499, #1500)
- The client IP integrity fix (#1501)

### Acceptance criteria

- [ ] Aggregator package and helpers implemented per the spec and fully unit-tested.
- [ ] `StatisticsParamsParser` enforces every rule in the Validation table and reports all errors at once.
- [ ] `Settings.max_range_days()` added and tested.
- [ ] `GET /staff/statistics/domains.json` implemented, restricted, tested, and not warmed by Navi.
- [ ] `staff-statistics.md` matches the shipped endpoint.
- [ ] The `data-access`, `security` and `cache` reviews pass.

## Benefits

Tab endpoints stay thin: they parse, query, aggregate and serialize. Bucketing is DST-correct and doesn't depend on the database (no MySQL `CONVERT_TZ` or `MEDIAN`), and the logic can be unit-tested in isolation. It also unblocks the frontend shell (#1499) and every tab implementation.
