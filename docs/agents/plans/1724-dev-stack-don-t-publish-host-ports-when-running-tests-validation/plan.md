# Plan: Dev stack: don't publish host ports when running tests/validation

Issue: [1724-dev-stack-don-t-publish-host-ports-when-running-tests-validation.md](../../issues/1724-dev-stack-don-t-publish-host-ports-when-running-tests-validation.md)

## Overview

Move every host-port mapping out of the root `docker-compose.yml` into an opt-in `docker-compose.ports.yml`, with every mapping bound to `127.0.0.1`. A plain `docker-compose run`/`up` then publishes nothing, so tests and validation runs can't clash with other projects' ports. `make dev-up` opts back into the ports file. A new `make stack-up` brings the stack up with no host ports, for the investigation runners. The MySQL host port gets its own variable, `MAJORA_MYSQL_HOST_PORT`.

## Agents involved

- [infra](infra.md)
- [investigator](investigator.md)
- [crawler](crawler.md)

## Shared contracts

- **Ports file**: `docker-compose.ports.yml` at the repo root, committed. Docker-compose does not auto-load it. It holds every host-port mapping, all bound to `127.0.0.1`. The base `docker-compose.yml` has no `ports:` at all.
- **Opt-in command form**: `docker-compose -f docker-compose.yml -f docker-compose.ports.yml up <service...>`. A plain `docker-compose ...` publishes nothing.
- **Makefile**:
  - `make dev-up`: interactive dev, with host ports (`localhost:3000`, `3030`, `3010`).
  - `make stack-up`: `docker-compose up -d majora_proxy majora_app majora_fe` from the base file only. It publishes no host ports and the services are reachable by name on `majora_default`.
- **MySQL host port**: `MAJORA_MYSQL_HOST_PORT` (default `3306`), used only by the ports file. `MAJORA_MYSQL_PORT` stays the in-network port the app connects on.
