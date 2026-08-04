# Issue: Add game domain to CSRF_TRUSTED_ORIGINS

## Description
In the backend, `CSRF_TRUSTED_ORIGINS` is currently populated only from an environment variable, but the app now has a `GameDomain` model representing hostnames that map to a `GameDomainGroup` (tenant/brand). Game domains should also be treated as trusted CSRF origins, without requiring every domain to be manually added to the env var.

## Problem
`CSRF_TRUSTED_ORIGINS` only reflects origins configured via the `CSRF_TRUSTED_ORIGINS` env var. `GameDomain` rows aren't reflected there, so requests coming through a game domain that isn't also manually listed in the env var fail Django's CSRF origin check.

## Expected Behavior
On backend boot, all `GameDomain` rows are turned into `scheme://domain` origins (based on each domain's `schemes`) and merged into `CSRF_TRUSTED_ORIGINS` alongside the existing env-var-based origins. This doesn't need to be live — adding a new `GameDomain` takes effect on the next server restart, which is already understood as part of the current ops process (the person adding domains is also the one restarting the server).

## Solution

### Schemes field on GameDomain

`GameDomain.domain` only stores a bare hostname (e.g. `example.com`), but `CSRF_TRUSTED_ORIGINS` needs full origins (`scheme://host`). Add a `schemes` field to `GameDomain`:

- A comma-separated string field (e.g. `"http,https"`), chosen over a separate schemes table or boolean flags because MySQL (the project's DB engine) has no native array/multi-select field, and this shape maps directly onto the `scheme://host` values `CSRF_TRUSTED_ORIGINS` needs.
- Defaults to `"https"` — existing and new domains are https-only unless explicitly given `http` too (e.g. for local/dev domains).
- Validated to only contain `http`/`https` tokens, since those are the only schemes relevant to CSRF trusted origins.
- `GameDomain` is registered in Django admin with no custom `ModelAdmin` (`games/admin.py`), so the new field appears in the admin form automatically — no extra admin work needed.

### Boot-time fetch mechanism

Querying the DB directly at `settings.py` import time is unsafe here: `manage.py migrate` itself is the first process to import `settings.py` (sometimes before the DB is even reachable), and CI jobs like `collectstatic`/lint checks import settings with no DB service at all. There's also no existing precedent in this codebase for DB-dependent settings (no `apps.py` `ready()` hooks anywhere).

Instead, use the Django middleware chain as the boot hook: a new middleware class (following the existing pattern of `games.middleware.CacheControlMiddleware`, `statistics.middleware.StatisticsSessionMiddleware`), inserted just before `django.middleware.csrf.CsrfViewMiddleware` in `MIDDLEWARE`. Its `__init__` runs exactly once per server process, only after `bin/server.sh` has already run `migrate` to completion (gunicorn/`runserver` start as a separate process from `migrate`, and management commands never build the middleware chain at all) — so the DB is guaranteed reachable and migrated by the time it runs.

In `__init__`, it queries all `GameDomain` rows once, builds `scheme://domain` origins from each domain's `schemes`, and extends `settings.CSRF_TRUSTED_ORIGINS` with them. The DB query is wrapped in a try/except so a transient DB hiccup at worker startup doesn't crash the process — falls back to the env-var-only origins for that worker if it fails.

### Combine vs. replace

GameDomain-derived origins are appended to the existing env-var-based `CSRF_TRUSTED_ORIGINS` list, not a replacement of it. Both sources stay valid at once.

### Scope of domains included

All `GameDomain` rows are included — no filtering by `GameDomainGroup` or any other subset.

### Testing approach

The middleware does its DB query once in `__init__` (when the middleware chain is first built for the process), not in `__call__` on every request. This means the standard `client.get(...)`-based pattern used by other middleware tests (e.g. `games/tests/middleware_test.py`) won't work here — by the time any test runs, `__init__` has likely already run once for the whole test session.

Instead:

- Instantiate the middleware directly in the test (`GameDomainCsrfOriginsMiddleware(get_response=lambda r: None)`) after seeding `GameDomain` fixtures, exercising the `__init__` logic in isolation.
- Wrap each test in `django.test.override_settings(CSRF_TRUSTED_ORIGINS=[...])` to establish a known baseline and avoid leaking mutated state into other tests.
- Cases to cover: multiple schemes on one domain producing multiple origins; several domains all included; env-based origins preserved alongside the new ones (combine, not replace); a DB error during the query (mock `GameDomain.objects.all` to raise) falling back gracefully with env-only origins remaining and no exception propagating.

## Benefits
- Game domains are automatically trusted for CSRF without manually maintaining them in an env var.
- No risk to `migrate`, `collectstatic`, or other management commands/CI jobs that import settings without a DB, since the DB query only happens in the middleware's `__init__`, safely after migrations have completed.
