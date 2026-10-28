# Summary params parsing

Parse the two query params of the summary endpoint, `period` and `tz`, reporting every error
at once, and build a `StatisticsFilters` for the rolling window.

- **Shared tz parsing:** extract the body of `StatisticsParamsParser._parse_tz` into a reusable
  helper (e.g. a module-level `parse_tz(name)` in `params_parser.py` returning
  `(zone, error_code)`), and make `_parse_tz` call it. Behaviour is unchanged: a missing `tz`
  is `UTC`, and an unknown one records `invalid_timezone` and falls back to UTC. The existing
  `params_parser_test.py` must keep passing as it is.
- **`SummaryParamsParser`** (new file `backend/statistics/aggregation/summary_params_parser.py`,
  exported from the package `__init__`):
  - `PERIODS = {'day': 1, 'week': 7, 'month': 30}` (window length in days), default `day`.
    An unknown `period` records `invalid_period`.
  - `__init__(query_params, today=None)`, with `today` injectable like `StatisticsParamsParser`.
    Otherwise today is `datetime.now(tz).date()`.
  - `parse()` returns `(summary, errors)`: `summary` is `None` whenever `errors` is non-empty,
    and errors use the `{<field>: [<code>]}` shape. Both `period` and `tz` errors are collected
    in the same call.
  - On success it returns the resolved `period` and a `StatisticsFilters` with
    `from_date = today − (days − 1)`, `to_date = today`, the `tz`, and
    `granularity` / `requested_granularity` resolved via `Granularity` (they are not exposed).
- Unit tests cover:
  - each period's window, from the injected `today`;
  - the defaults;
  - `invalid_period`, `invalid_timezone`, and both combined;
  - other params such as `from=bad` or `granularity=bad` being ignored;
  - "today" taken in `tz` rather than in UTC (e.g. 01:00 UTC is still the previous day in
    `America/Sao_Paulo`).

## Files to Change

- `backend/statistics/aggregation/params_parser.py` — extract the shared tz parsing helper.
- `backend/statistics/aggregation/summary_params_parser.py` — new `SummaryParamsParser`.
- `backend/statistics/aggregation/__init__.py` — export it and mention it in the docstring.
- `backend/statistics/tests/aggregation/summary_params_parser_test.py` — new tests.
