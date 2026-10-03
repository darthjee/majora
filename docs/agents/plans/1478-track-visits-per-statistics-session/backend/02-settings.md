# Settings for window and throttle

Add two static methods to `statistics.settings.Settings`, using `env_int`:

- `visit_inactivity_seconds()` — `MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS`, default
  `30 * 60`
- `session_touch_interval_seconds()` — `MAJORA_STATISTICS_SESSION_TOUCH_INTERVAL_SECONDS`,
  default `60`

Document both in `.env.dev.sample` under "Statistics settings".

## Files to Change

- `backend/statistics/settings.py` — two new settings
- `.env.dev.sample` — new env vars with defaults
