# Infra Plan: Dev stack: backend tests can't create test_majora locally (MySQL 1044 for user majora)

Main plan: [plan.md](plan.md)

## Overview
Fix error 1044 on local backend test runs by giving the `majora_tests` service root DB credentials, as CI does. Also:

- move MySQL to 8.4 everywhere (production already runs 8.4);
- make the test runner depend on a healthy MySQL;
- add a guard that keeps the base `docker-compose.yml` free of host ports.

## Context
- `majora_tests` inherits `.env` (`MAJORA_MYSQL_USER=majora`). The official MySQL image only grants `majora` privileges on `majora.*`, so Django can't `CREATE DATABASE test_majora`.
- CI's three backend jobs (`pytest_views_characters`, `pytest_views_rest`, `pytest_all`) already use `MAJORA_MYSQL_USER: root` / `MAJORA_MYSQL_PASSWORD: majora`, on `cimg/mysql:8.0`.
- Local `majora_mysql` runs `mysql:9.3.0` with `MYSQL_ROOT_PASSWORD: majora`, so root works with the same password everywhere.
- `majora_tests` only has `depends_on: base_build`, so it doesn't start MySQL itself.
- Host ports are opt-in since #1724. The base `docker-compose.yml` publishes nothing; `docker-compose.ports.yml` holds every mapping, bound to `127.0.0.1`. This must stay true, because tests run in parallel with other projects' suites on the same host.
- Going from 9.3 to 8.4 is a downgrade, and MySQL 8.4 can't start on a data dir created by 9.3. No local data needs keeping, so developers just wipe `docker_volumes/mysql_data` (docs only, no tooling).

## Steps

- [01 — MySQL 8.4, healthcheck and root credentials in docker-compose](infra/01-docker-compose-mysql.md)
- [02 — MySQL 8.4 in CircleCI](infra/02-circleci-mysql.md)
- [03 — No-host-ports guard in check_infra.sh](infra/03-no-ports-guard.md)
- [04 — Documentation](infra/04-docs.md)

## CI Checks
- Root / infra: `.claude/scripts/check_infra.sh`. It runs `docker-compose config -q`, parses the CircleCI YAML and runs the new no-ports guard. It then runs the full backend suite + ruff via `check_backend.sh`, and the frontend checks.
- `backend/`: `docker-compose run --rm majora_tests poetry run pytest` (CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all`).

## Notes
- **Before running anything locally after step 01**, stop the stack and wipe `docker_volumes/mysql_data` (9.3 → 8.4 downgrade), then run `make setup`.
- Do the manual verification from the issue's "Testing strategy" and report the results in the PR:
  - a fresh-volume run has 0 DB-setup errors;
  - `docker port majora_mysql` prints nothing while tests run;
  - tests still work while another process holds host port 3306;
  - `make setup` + `make dev-up` work, and `majora_app` still connects as `majora`.
- Out of scope:
  - production config (`.env.prod`, `base_prod`, `majora_prod_app`);
  - the `majora_mysql` mapping in `docker-compose.ports.yml`, and `MAJORA_MYSQL_HOST_PORT`;
  - the check-script exit code.
- Risk: MySQL 8.4 disables `mysql_native_password` by default. `mysqlclient` supports `caching_sha2_password`. If a connection fails locally or in CI, fix it in the client or image, not by re-enabling the native plugin.
