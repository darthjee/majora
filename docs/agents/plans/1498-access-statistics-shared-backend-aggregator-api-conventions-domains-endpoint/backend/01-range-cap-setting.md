# Range cap setting

Add `Settings.max_range_days()` to `backend/statistics/settings.py`, following the existing
static-method pattern: `env_int('MAJORA_STATISTICS_MAX_RANGE_DAYS', 366)`, with a docstring
explaining the inclusive day cap. Add the variable to `.env.dev.sample` next to the other
`MAJORA_STATISTICS_*` entries.

## Files to Change

- `backend/statistics/settings.py`: new `max_range_days()`.
- `backend/statistics/tests/settings_test.py`: default (366) and env override.
- `.env.dev.sample`: `MAJORA_STATISTICS_MAX_RANGE_DAYS=366`.
