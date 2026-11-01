# Backend Plan: Dev stack: local frontend at localhost:3000 renders a blank page

Main plan: [plan.md](plan.md)

## Shared contracts

- `SEED_DEV_DOMAINS` must be exactly `true` **and** `STAGE` must not be `production`; otherwise
  `seed_dev_domains` prints a one-line "skipped" notice and exits `0`.
- `bin/configure_database.sh` gains a `seed` action (runs `manage.py seed_dev_domains`) and a
  `setup` action (`wait` + `migrate` + `seed`). Infra calls `setup` from `make setup`.
- `bin/server.sh` runs `bin/configure_database.sh seed` after migrations, before starting the
  server.
- The `GET /games.json` 404 body (`{"errors": {"detail": ["domain_not_recognized"]}}`) stays
  unchanged.

## Steps

- [01 — Accept `localhost` in the domain validator](backend/01-validator-accepts-localhost.md)
- [02 — `seed_dev_domains` management command](backend/02-seed-dev-domains-command.md)
- [03 — Wire the seed into the boot scripts](backend/03-wire-seed-into-boot-scripts.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest domains` plus ruff (CI jobs:
  `pytest_all`, `checks`).

## Notes

- `get_or_create` skips model validators, so step 01 matters for Django admin editing, not for
  the seed itself. Still, call `full_clean()` on newly created `Domain` rows in step 02, so a
  validator regression is caught.
- The domain caches (`RegisteredDomainsCache`, `DomainGamesCache`) are per process and in memory,
  and `DomainCsrfOriginsMiddleware` reads `Domain` rows once, when the process starts. Seeding
  before `runserver` avoids stale caches; nothing needs to be invalidated.
