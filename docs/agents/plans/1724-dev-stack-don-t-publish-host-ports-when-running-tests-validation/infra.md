# Infra Plan: Dev stack: don't publish host ports when running tests/validation

Main plan: [plan.md](plan.md)

## Shared contracts

- **Ports file**: `docker-compose.ports.yml` at the repo root, committed. Docker-compose does not auto-load it. It holds every host-port mapping, all bound to `127.0.0.1`. The base `docker-compose.yml` has no `ports:` at all.
- **Opt-in command form**: `docker-compose -f docker-compose.yml -f docker-compose.ports.yml up <service...>`. A plain `docker-compose ...` publishes nothing.
- **Makefile**:
  - `make dev-up`: interactive dev, with host ports (`localhost:3000`, `3030`, `3010`).
  - `make stack-up`: `docker-compose up -d majora_proxy majora_app majora_fe` from the base file only. It publishes no host ports and the services are reachable by name on `majora_default`.
- **MySQL host port**: `MAJORA_MYSQL_HOST_PORT` (default `3306`), used only by the ports file. `MAJORA_MYSQL_PORT` stays the in-network port the app connects on.

infra **produces** all of the above. The `investigator` and `crawler` docs rely on the file name, the `make stack-up` target and the opt-in command form.

## Steps

- [01 — Move host ports into an opt-in ports file](infra/01-opt-in-ports-file.md)
- [02 — Decouple the MySQL host port](infra/02-mysql-host-port.md)
- [03 — Makefile targets](infra/03-makefile-targets.md)
- [04 — Update root and agent docs](infra/04-update-docs.md)

## CI Checks

- Markdown: `docker-compose run --rm markdownlint` (CI job: `markdownlint`)
- CircleCI does not use docker-compose, so no other CI job is affected.

## Notes

- Manual verification:
  1. Stop the stack, then run `make tests` (or `docker-compose run --rm majora_tests pytest`) and confirm `docker ps` shows no published ports for `majora_mysql`.
  2. Run `make dev-up` and confirm `localhost:3000` works and the ports are bound to `127.0.0.1`.
  3. Run `make stack-up` and confirm the statistics-bug `emulate` runner reaches `majora_proxy`.
- Switching between `make dev-up` and `make stack-up` recreates the containers, because the port config differs. That is expected.
- Binding to `127.0.0.1` drops LAN access (e.g. testing from a phone). The issue accepts that.
- Users' existing `.env` files lack `MAJORA_MYSQL_HOST_PORT`, so the compose file must use the `${MAJORA_MYSQL_HOST_PORT:-3306}` default.
