# Infra Plan: Dev stack: local frontend at localhost:3000 renders a blank page

Main plan: [plan.md](plan.md)

## Shared contracts

- Set `SEED_DEV_DOMAINS=true` only on `majora_app` (its `environment:` list in
  `docker-compose.yml`), never on `majora_prod_app` or `majora_tests`.
- Backend provides `bin/configure_database.sh setup` (`wait` + `migrate` + `seed`).

## Implementation Steps

### Step 1 — Enable the seed in the dev stack

Add `- SEED_DEV_DOMAINS=true` to `majora_app`'s `environment:` list in `docker-compose.yml`.
Don't add it to `.env.dev.sample`: `env_file: .env` is shared by other services (including
`majora_tests`), and the opt-in must stay scoped to `majora_app`. Leave `majora_prod_app`
unchanged. Don't touch the ports or `docker-compose.ports.yml` (#1724 stays as is).

### Step 2 — `make setup` runs migrate + seed, and update the docs

Change the `setup` target to
`docker-compose run --rm $(PROJECT)_app bin/configure_database.sh setup`. Since it runs on
`majora_app`, it inherits `SEED_DEV_DOMAINS=true`. Update every place that describes
`make setup` as "Run Django migrations" so it reads "Run Django migrations and seed the local
dev domains (`localhost`, `127.0.0.1`)". Add a short note that a running app needs a restart to
pick up rows seeded by `make setup` (per-process in-memory caches); `make dev-up` seeds by
itself on boot.

## Files to Change

- `docker-compose.yml`: `SEED_DEV_DOMAINS=true` on `majora_app`.
- `Makefile`: the `setup` target.
- `AGENTS.md`, `README.md`, `docs/agents/external/navi/option-e-development-image.md`:
  `make setup` description.

## Notes

- Out of scope (documented in the issue): `stack-up` runners reach the proxy as `majora_proxy`,
  which isn't seeded, so their `/games.json` calls keep returning `404`.
