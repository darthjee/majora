# Backend Plan: Add domain configuration

Main plan: [plan.md](plan.md)

## Shared contracts

Produces `GET /domain/config.json` — see [plan.md](plan.md)'s "Shared contracts" for the exact response shape, null/`""` semantics, and host-resolution rule. Also produces the `DomainConfiguration.favicon` string value, which must always be a path under the `/domain/` prefix that `proxy`/`infra` (see their plans) serve as static files.

## Steps

- [01 — `DomainConfiguration` model](backend/01-domain-configuration-model.md)
- [02 — Migrate `Domain.title` into `DomainConfiguration`, then drop it](backend/02-migrate-and-drop-domain-title.md)
- [03 — `GET /domain/config.json` endpoint](backend/03-domain-config-endpoint.md)
- [04 — Tests](backend/04-tests.md)

## CI Checks

- `backend`: `poetry run pytest --cov` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` + `bin/reports.sh ci` (CI job: `checks`)

## Notes

- Follow the existing `accounts` app layout as the structural precedent for the new endpoint: `accounts/views/auth/header_status.py` (view) + `accounts/urls/auth.py` (`path('users/header_status.json', ...)`) + `accounts/urls/__init__.py` (aggregation) + `majora_project/urls.py` (`include('accounts.urls')`). Mirror this inside `domains/` (e.g. `domains/views/config.py`, `domains/urls.py` or `domains/urls/__init__.py`), then add `path('', include('domains.urls'))` to `majora_project/urls.py`.
- Do not call `skip_cache`/set `X-Skip-Cache` on this response — unlike `header_status`, this endpoint is meant to be cacheable (per the issue's "Performance & security" decision: config only changes on deploy, no cache-busting needed).
