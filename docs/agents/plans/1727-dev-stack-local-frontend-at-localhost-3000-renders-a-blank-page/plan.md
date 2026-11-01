# Plan: Dev stack: local frontend at localhost:3000 renders a blank page

Issue: [1727-dev-stack-local-frontend-at-localhost-3000-renders-a-blank-page.md](../../issues/1727-dev-stack-local-frontend-at-localhost-3000-renders-a-blank-page.md)

## Overview

A fresh dev database has no `Domain` rows, so `GET /games.json` on `localhost` answers `404
domain_not_recognized`, and the app has no error boundary to stop a render error from blanking
the page. This plan fixes it in three parts:

- **Backend:** an opt-in, idempotent `seed_dev_domains` command (plus a `seed` action in
  `bin/configure_database.sh`, called from `bin/server.sh`) registers `localhost` and
  `127.0.0.1` and attaches every game. The domain validator learns to accept `localhost`.
- **Infra:** enables the seed on `majora_app` and makes `make setup` run it.
- **Frontend:** adds an app-wide error boundary and a translated warning on the games list for
  `domain_not_recognized`. The translator owns the en/pt keys.

## Agents involved

- [backend](backend.md)
- [infra](infra.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Seed opt-in env var (backend ↔ infra)

- `SEED_DEV_DOMAINS`: the seed runs only when the value is exactly `true`, **and** `STAGE` is
  not `production`. In every other case `seed_dev_domains` prints a one-line "skipped" notice
  and exits `0`.
- Infra sets `SEED_DEV_DOMAINS=true` only on the `majora_app` service in
  `docker-compose.yml` (its `environment:` list). It is never set on `majora_prod_app` or
  `majora_tests`.

### `bin/configure_database.sh` actions (backend ↔ infra)

- New action `seed`: `poetry run python manage.py seed_dev_domains` (the guard lives in the
  command, not in the script).
- New action `setup`: `wait` + `migrate` + `seed`.
- Existing actions `wait`, `migrate` and `all` keep their behaviour.
- `bin/server.sh` calls `bin/configure_database.sh seed` after its existing migrate/all call,
  before starting the server (backend).
- `make setup` becomes
  `docker-compose run --rm majora_app bin/configure_database.sh setup` (infra).

### Backend 404 body (backend → frontend, unchanged)

`GET /games.json` from an unregistered host answers `404` with
`{"errors": {"detail": ["domain_not_recognized"]}}`. This shape already exists and must not
change.

### Translation keys (frontend ↔ translator)

Both `frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/`:

- `error_boundary.title`: en "Something went wrong" (new file `error_boundary.yaml`).
- `error_boundary.message`: en "An unexpected error occurred while rendering this page."
- `error_boundary.reload`: en "Reload page".
- `games_page.domain_not_recognized`: en "This domain is not configured, so no games can be
  listed." (added to the existing `games_page.yaml`).

The frontend reads them with `Translator.t(key)`.
