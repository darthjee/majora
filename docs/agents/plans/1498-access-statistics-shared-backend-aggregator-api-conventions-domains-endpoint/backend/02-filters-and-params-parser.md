# Aggregation core: granularity, filters, params parser

Create the `backend/statistics/aggregation/` package (plain classes, one per file, like
`games/caches/`), following the spec's "Python aggregator", "Query params" and "Validation"
sections:

- `granularity.py`: `Granularity` constants (`DAY`, `WEEK`, `MONTH`, `AUTO`),
  `DAY_MAX_DAYS = 31`, `WEEK_MAX_DAYS = 186`, and `resolve(requested, from_date, to_date)`.
  Day counts are inclusive.
- `filters.py`: frozen dataclass `StatisticsFilters` (`from_date`, `to_date`, `tz` as
  `ZoneInfo`, `granularity`, `requested_granularity`, `user_id`, `domain` as
  `int | 'unknown' | None`, `audience`). Properties `start_utc` / `end_utc` give the half-open
  interval `[from 00:00 tz, (to + 1) 00:00 tz)` converted to UTC, via
  `datetime.combine(day, time.min, tzinfo=tz)`. `as_dict()` returns the envelope's `filters`
  echo (ISO dates, the tz key, `user` / `domain` / `audience`).
- `params_parser.py`: `StatisticsParamsParser(query_params, today=None)`, whose `parse()`
  returns `(filters, errors)`. Rules:
  - Defaults: `to` = today in `tz`, `from` = `to − 29`, `tz` = `UTC`, `granularity` = `auto`,
    `audience` = `all`.
  - Errors are collected for every field at once, using the codes `invalid_date`,
    `from_after_to`, `range_too_long` (key `range`), `invalid_timezone`,
    `invalid_granularity`, `invalid_audience`, `invalid_user`, `invalid_domain`, `invalid_page`
    and `invalid_per_page` (`per_page > 100`).
  - Range checks run only when both dates parsed.
  - Unknown params are ignored.
  - `tz` must be in `zoneinfo.available_timezones()` (cache that set once).
  - Use one small private method per param to keep complexity low.
  - `today` is injectable for tests.
- `__init__.py` re-exports the public classes.

Tests in `backend/statistics/tests/aggregation/` (add `__init__.py`):

- `granularity_test.py`: threshold boundaries 31/32 and 186/187, and the explicit override.
- `filters_test.py`: `start_utc` / `end_utc` across a DST change (e.g. `Europe/Lisbon`), and
  the `as_dict()` shape.
- `params_parser_test.py`: defaults, each error code, several errors at once, range checks
  skipped on a bad date, the 366/367 cap boundary, `domain=unknown`, and an ignored unknown
  param.

## Files to Change

- `backend/statistics/aggregation/__init__.py`: new package.
- `backend/statistics/aggregation/granularity.py`: new.
- `backend/statistics/aggregation/filters.py`: new.
- `backend/statistics/aggregation/params_parser.py`: new.
- `backend/statistics/tests/aggregation/__init__.py`: new.
- `backend/statistics/tests/aggregation/granularity_test.py`: new.
- `backend/statistics/tests/aggregation/filters_test.py`: new.
- `backend/statistics/tests/aggregation/params_parser_test.py`: new.
