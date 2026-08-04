# Plan: Add game domain to CSRF_TRUSTED_ORIGINS

Issue: [961-add-game-domain-to-csrf-trusted-origins.md](../../issues/961-add-game-domain-to-csrf-trusted-origins.md)

## Overview

Add a `schemes` field to `GameDomain`, then add a new middleware that, once per server process (at `__init__`, after migrations are guaranteed applied), queries all `GameDomain` rows and appends their `scheme://domain` origins to `settings.CSRF_TRUSTED_ORIGINS` alongside the existing env-var-based origins.

## Context

`CSRF_TRUSTED_ORIGINS` is currently populated only from the `CSRF_TRUSTED_ORIGINS` env var (`backend/majora_project/settings.py:16-18`). `GameDomain` (`backend/games/models/game/game_domain.py`) stores a bare hostname per row, tied to a `GameDomainGroup`. Domains registered there aren't trusted CSRF origins unless also manually added to the env var. This should be fixed without querying the DB at `settings.py` import time, since that import happens before the DB is guaranteed ready (e.g. during `manage.py migrate` itself, and during `collectstatic`/lint CI jobs that have no DB service at all) — see the issue's "Boot-time fetch mechanism" section for the full reasoning.

## Implementation Steps

### Step 1 — Add `schemes` field to `GameDomain`

In `backend/games/models/game/game_domain.py`, add:

```python
schemes = models.CharField(max_length=20, default='https', validators=[validate_schemes])
```

(or an equivalent `clean()`/field validator) that rejects anything other than a comma-separated combination of `http`/`https` tokens (e.g. `"https"`, `"http,https"`). Generate and commit the migration (`poetry run python manage.py makemigrations games`).

### Step 2 — Add a helper to build origins from a `GameDomain`

Add a method or property on `GameDomain` (or a small module-level helper) that turns `schemes` + `domain` into a list of `scheme://domain` strings, e.g. `GameDomain.origins` → `['https://example.com']` or `['http://example.com', 'https://example.com']`. Keep this on the model (or right next to it) since it's a pure data transform of the model's own fields, not middleware logic.

### Step 3 — Add the CSRF origins middleware

In `backend/games/middleware.py`, alongside the existing `CacheControlMiddleware`, add a new middleware class (e.g. `GameDomainCsrfOriginsMiddleware`) following the same `__init__(self, get_response)` / `__call__(self, request)` shape:

```python
class GameDomainCsrfOriginsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        try:
            origins = [origin for domain in GameDomain.objects.all() for origin in domain.origins]
            settings.CSRF_TRUSTED_ORIGINS = list(settings.CSRF_TRUSTED_ORIGINS) + origins
        except (OperationalError, ProgrammingError):
            pass

    def __call__(self, request):
        return self.get_response(request)
```

The try/except covers a transient DB hiccup at worker startup — the worker falls back to env-only origins rather than crashing.

### Step 4 — Register the middleware

In `backend/majora_project/settings.py`, insert the new middleware into `MIDDLEWARE` immediately before `'django.middleware.csrf.CsrfViewMiddleware'`, so `CSRF_TRUSTED_ORIGINS` is already extended by the time the CSRF check runs.

### Step 5 — Test fixtures

Add a `GameDomainFactory` (and `GameDomainGroupFactory` if not already implied by it) under `backend/games/tests/factories/`, following the existing pattern in `backend/games/tests/factories/game.py`, and export it from `backend/games/tests/factories/__init__.py`.

### Step 6 — Tests

Add tests (likely in `backend/games/tests/middleware_test.py`, alongside the existing `CacheControlMiddleware` tests, or a new `game_domain_middleware_test.py` if that reads cleaner) that:

- Instantiate the middleware directly (`GameDomainCsrfOriginsMiddleware(get_response=lambda r: None)`) after seeding `GameDomain` fixtures — the DB query runs in `__init__`, not `__call__`, so the standard `client.get(...)` pattern used by other middleware tests won't exercise this per-test.
- Wrap each test in `django.test.override_settings(CSRF_TRUSTED_ORIGINS=[...])` to establish a known baseline and avoid leaking mutated state into other tests.
- Cover: multiple schemes on one domain → multiple origins; several domains → all included; env-based origins preserved alongside the new ones; a DB error during the query (mock `GameDomain.objects.all` to raise `OperationalError`/`ProgrammingError`) → falls back gracefully, env-only origins remain, no exception propagates.

Also add a model-level test for the `schemes` field validator (rejects tokens other than `http`/`https`) and the origins helper from Step 2.

## Files to Change

- `backend/games/models/game/game_domain.py` — add `schemes` field + validation, add the `scheme://domain` origins helper.
- `backend/games/migrations/` — new migration for the `schemes` field.
- `backend/games/middleware.py` — add `GameDomainCsrfOriginsMiddleware`.
- `backend/majora_project/settings.py` — register the new middleware in `MIDDLEWARE`, before `CsrfViewMiddleware`.
- `backend/games/tests/factories/game_domain.py` (new) — `GameDomainFactory`.
- `backend/games/tests/factories/__init__.py` — export the new factory.
- `backend/games/tests/middleware_test.py` (or a new file) — middleware tests.
- `backend/games/tests/models/` — test for the `schemes` field validator and origins helper (path depends on existing per-model test layout).

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers `games/tests/middleware_test.py` and model tests.
- `backend`: `poetry run ruff check .` (CI job: `checks`) — lint.

## Notes

- No frontend, proxy, infra, or cache-warmer changes — this is entirely backend/`games` app scope.
- `GameDomain` is registered in Django admin with no custom `ModelAdmin` (`backend/games/admin.py:66`), so the new `schemes` field appears in the admin form automatically.
- Existing `GameDomain` rows get `schemes='https'` via the migration's field default — no manual data migration needed.
