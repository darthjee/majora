# Backend Plan: Production: proxy secret was missing, so the backend recorded the load balancer's IP and inflated statistics sessions

Main plan: [plan.md](plan.md)

## Shared contracts

- "Production settings" = `settings.DEBUG is False`.
- Logger `common`, level `WARNING`, message exactly
  `PROXY_SECRET is not set: X-Forwarded-For is ignored and client IPs fall back to REMOTE_ADDR`.
- Never log the secret value. Trust logic in `common/client_ip.py` is unchanged.

## Implementation Steps

### Step 1 — Startup warning when `PROXY_SECRET` is empty

- In `backend/common/client_ip.py` add `warn_if_proxy_secret_missing()`: when
  `not settings.DEBUG and not proxy_secret()`, log the contract message on
  `logging.getLogger('common')` at `WARNING`; otherwise do nothing. Reuse `proxy_secret()`.
- Call it from a new `CommonConfig.ready()` in `backend/common/apps.py` (import inside `ready`,
  as `accounts/apps.py` does). Confirm `common` is the app label registered in
  `INSTALLED_APPS` (`common` or `common.apps.CommonConfig`).
- In `backend/majora_project/settings.py`, add a `'common'` logger to `LOGGING` with the same
  shape as `accounts`/`staff` (console handler, `DJANGO_LOG_LEVEL`, `propagate: False`) so the
  line reaches stdout and Render's logs; update the comment above `LOGGING` that lists the apps
  that log.

### Step 2 — Tests

In `backend/common/tests/client_ip_test.py` (pytest, matching the file's style), test
`warn_if_proxy_secret_missing` with `settings` and `monkeypatch`/`caplog`:

- `DEBUG=False`, `PROXY_SECRET` unset → one `WARNING` with the exact message on `common`;
- `DEBUG=False`, `PROXY_SECRET` set to a dummy value → no warning, and the value never appears
  in the captured logs;
- `DEBUG=True`, unset → no warning.

## Files to Change

- `backend/common/client_ip.py` — `warn_if_proxy_secret_missing()`.
- `backend/common/apps.py` — `ready()` calling it.
- `backend/majora_project/settings.py` — `common` logger.
- `backend/common/tests/client_ip_test.py` — tests.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest common`, and ruff as in CI.

## Notes

- `ready()` also runs for management commands (migrate, tests); the warning is only a log
  line, so that is acceptable. Tests run with `DEBUG` as configured by the test settings, so
  use `settings.DEBUG` overrides explicitly.
