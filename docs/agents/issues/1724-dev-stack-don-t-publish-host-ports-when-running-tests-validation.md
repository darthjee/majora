# Issue: Dev stack: don't publish host ports when running tests/validation

## Description

The root `docker-compose.yml` publishes host ports, bound on `0.0.0.0`, for most services. Tests and validation runs never need them, but a host-port clash with another project still stops the stack from starting. This issue moves every host-port mapping into an opt-in compose file. A plain `docker-compose run`/`up` then publishes nothing. Interactive dev opts back in explicitly.

## Problem

Current host-port mappings in `docker-compose.yml`:

| Service | Mapping |
| --- | --- |
| `majora_mysql` | `0.0.0.0:$MAJORA_MYSQL_PORT:3306` (`MAJORA_MYSQL_PORT=3306` in `.env`) |
| `majora_app` / `majora_prod_app` | `0.0.0.0:3030:8080` |
| `majora_fe` | `0.0.0.0:3010:8080` |
| `majora_proxy` | `0.0.0.0:3000:80` |
| `majora_navi` | `0.0.0.0:3100:3000` |
| `majora_phpmyadmin` | `0.0.0.0:3050:80` |
| `crawler_navi_web` | `127.0.0.1:3110:3000` |

Tests and validation runs reach services by name over the Docker network (`majora_default`) and never need a host port. That covers `make tests` and the investigation runners under `investigations/<topic>/docker-compose.yml`, such as `emulate` and `analyse`. Even so:

- `make tests` (`docker-compose run majora_tests`) starts `majora_mysql` through the base service's `links:`, and that service publishes host port 3306. So `make tests` alone fails when another project holds 3306.
- The investigation runners need `majora_proxy`/`majora_app` running. Today the only way to start them is `make dev-up`, which binds 3000, 3030, 3010, 3306 and 3050.
- `MAJORA_MYSQL_PORT` does two jobs. It is the host-side MySQL port, and the app reads it from `.env` as the port to connect on. `majora_app` overrides it to `3306`, but `majora_tests` and `base` don't. Changing it to dodge a host clash would therefore break the in-network connection.

This bit us while validating #1703 locally. Another project's container (`margate-mysql-1`) held host port 3306, so `majora_mysql` could not be recreated and `majora_app`/`majora_proxy` stayed down. That blocked the validation.

## Expected Behavior

- By default, no host port is bound. A bare `docker-compose run`/`up`, including the commands agents run per `AGENTS.md`, publishes nothing.
- Tests (`make tests`, `docker-compose run --rm majora_tests ...`, client/proxy/frontend test commands) and investigation runners work with no host ports published.
- Interactive dev (`make dev-up`, browser on `localhost:3000`) still works and opts into host ports explicitly.
- Host ports that are published bind to `127.0.0.1` only.
- A host-port clash with another project no longer blocks test or validation runs.

## Solution

1. **Opt-in ports file.** Move every `ports:` mapping out of `docker-compose.yml` into a new committed file, e.g. `docker-compose.ports.yml`. Pick a name docker-compose does **not** auto-load, so not `docker-compose.override.yml`. It covers `majora_mysql`, `majora_app`, `majora_prod_app`, `majora_fe`, `majora_proxy`, `majora_navi`, `majora_phpmyadmin` and `crawler_navi_web`. The base file then publishes nothing.
2. **Bind to localhost.** Every mapping in the ports file binds to `127.0.0.1` instead of `0.0.0.0`.
3. **Decouple the MySQL host port.** Add `MAJORA_MYSQL_HOST_PORT` (default `3306`) to `.env.dev.sample` and use it only for the host-side mapping in the ports file (`127.0.0.1:${MAJORA_MYSQL_HOST_PORT:-3306}:3306`). `MAJORA_MYSQL_PORT` stays the in-network port the app connects on, so changing the host port can never break app or test DB connections.
4. **Makefile.**
   - `make dev-up` runs `docker-compose -f docker-compose.yml -f docker-compose.ports.yml up ...`, so the interactive workflow keeps its host ports.
   - Add a target (e.g. `make stack-up`) that brings up `majora_proxy`, `majora_app` and `majora_fe` with the base file only: no host ports, reachable on `majora_default`. Investigation runners use this.
   - `make tests`, `make dev`, `make setup` and the `client-*` targets keep using the base file only.
5. **Docs.**
   - Update `AGENTS.md` and the relevant `docs/agents/` pages (e.g. `cache-warmer.md` for `majora_navi` on 3100, and the `crawler_navi_web` note in `AGENTS.md`) to say that host ports are opt-in through the ports file, and show the `-f` command for services you want to reach from the host.
   - Update `investigations/statistics-bug/README.md` (and the investigator guidance) to use the no-ports stack target instead of `make dev-up`.

Owner: `infra` (docker-compose, Makefile, `.env` samples), with `architect` for the `AGENTS.md`/`docs/agents/` updates and `investigator` for the investigation README. CircleCI does not use docker-compose, so CI is unaffected.

## Benefits

- Tests and validation runs never clash with other projects' containers on the same machine.
- Agents and ad-hoc `docker-compose` commands are safe by default, because nothing is published unless asked for.
- Dev ports are no longer exposed on every network interface.
- The MySQL host port can be moved without breaking in-network DB connections.
