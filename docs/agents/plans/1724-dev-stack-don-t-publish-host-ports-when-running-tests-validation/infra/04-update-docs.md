# Update root and agent docs

Say that host ports are opt-in, and use the new commands wherever docs show a service being reached from the host:

- `AGENTS.md`, Development section:
  - Add `make stack-up`.
  - Say host ports (`3000`, `3030`, `3010`) are published only by `make dev-up` / `docker-compose.ports.yml`, bound to `127.0.0.1`.
  - Say plain `docker-compose run/up` publishes nothing.
  - Update the `crawler_navi_web` line to the `-f docker-compose.yml -f docker-compose.ports.yml up crawler_navi_web` form.
- `README.md`, Running the Application: note the ports come from `make dev-up` (ports file), and add `make stack-up` for headless/test use.
- `.claude/agents/infra.md`:
  - Service table: mark the ports as opt-in via `docker-compose.ports.yml`, bound to `127.0.0.1`.
  - Makefile table: update `dev-up`, add `stack-up`.
  - Mention `MAJORA_MYSQL_HOST_PORT`.
- `docs/agents/frontend/running-locally.md`: port 3010 is published via the ports file (`make dev-up`).
- `docs/agents/cache-warmer.md`, Local testing: use `docker-compose -f docker-compose.yml -f docker-compose.ports.yml up majora_navi` so the web UI on `localhost:3100` stays reachable, including the `MAJORA_PRODUCTION_URL=...` example.
- `docs/agents/folder-structure.md`: list `docker-compose.ports.yml` next to `docker-compose.yml` if the root files are listed there.

## Files to Change
- `AGENTS.md` — Development section (host ports opt-in, `make stack-up`, `crawler_navi_web` command).
- `README.md` — Running the Application.
- `.claude/agents/infra.md` — service and Makefile tables, new env var.
- `docs/agents/frontend/running-locally.md` — port 3010 note.
- `docs/agents/cache-warmer.md` — `majora_navi` command with the ports file.
- `docs/agents/folder-structure.md` — list the new root file.
