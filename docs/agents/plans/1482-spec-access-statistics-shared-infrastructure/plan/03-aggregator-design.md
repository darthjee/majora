# Python aggregator design

Specify the model-level aggregator the "Decided" section requires:

- **Location:** inside the `backend/statistics/` app (e.g. a `statistics/aggregation/`
  module), keeping views thin; name the classes.
- **Interface:** construction from validated filters (range, tz, granularity, user, domain,
  audience), a queryset builder applying the filters to `Visit` (with the visitor key from
  the data model page: `user_id` if set, else the session id), and `values_list(...)` of only
  the needed columns.
- **Bucketing:** UTC → `zoneinfo` conversion, day / ISO week (Monday) / month keys, DST
  behaviour, and zero-filling every bucket in the range.
- **Helpers:** counts, unique visitors per bucket, average and median duration, and a
  histogram helper (bucket edges as input), each pure and unit-testable without the DB.
- **Validation location:** a shared params parser/validator used by every endpoint (so the
  400 rules from step 02 live in one place).

## Files to Change
- `docs/agents/specs/access-statistics/shared-infrastructure.md` — Aggregator section.
