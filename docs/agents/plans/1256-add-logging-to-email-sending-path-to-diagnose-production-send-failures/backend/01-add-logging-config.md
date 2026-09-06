# Add a Django LOGGING config

`backend/majora_project/settings.py` has no `LOGGING` dict at all today, so
any `logger.info(...)` call anywhere in the app is silently dropped — Python's
root logger has no handler below `WARNING` by default. Add a targeted config
so the `accounts` and `staff` loggers (the only two apps that log anything)
write to stdout, which Render's log capture reads.

Scope it to `accounts`/`staff` with `propagate: False` rather than attaching a
handler to the root logger: Django's own `DEFAULT_LOGGING` already attaches a
console handler to the `'django'` logger, which propagates to root by
default — a root handler would double-print those records in local dev when
`DEBUG=True`. `disable_existing_loggers: False` is required so `dictConfig`
doesn't tear down Django's own pre-existing logger config.

Add a new `DJANGO_LOG_LEVEL` env var (default `INFO`) to control the level,
always on regardless of `DEBUG` (this is meant for production diagnostics).

## Files to Change

- `backend/majora_project/settings.py` — add `import sys`, then a `LOGGING`
  dict with a stdout `StreamHandler` and `accounts`/`staff` logger entries,
  placed after the existing email-settings block.
- `.env.dev.sample` — document `DJANGO_LOG_LEVEL=info` alongside the other
  Django settings, for local-dev discoverability.
