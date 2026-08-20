# Infra Plan: Add domain configuration

Main plan: [plan.md](plan.md)

## Shared contracts

Provides the deploy-time-linked `domain/` folder that `proxy` serves as static files (see [plan.md](plan.md)'s "Shared contracts") — the directory name (`domain`) must match exactly across the CircleCI job, the proxy rule, and the docker-compose mount.

## Implementation Steps

### Step 1 — `link_domain` CircleCI job

Add a `link_domain` job to `.circleci/config.yml`, mirroring the existing `link_photos` job (`.circleci/config.yml:402-416`) almost exactly: same docker image (`darthjee/tent:0.10.4`), same `generate_key_file`/`generate_folder` steps, then `SOURCE=$REMOTE_HOME/domain DEPLOY_PATH=domain bin/deploy_frontend.sh link`. Wire it into the workflow the same way `link_photos`/`link_files` are wired (`.circleci/config.yml`'s `workflows` section, ~line 82-104): add `link_domain` alongside them with the same `requires`/`filters`, and add `link_domain` to the final `release` job's `requires` list.

### Step 2 — Local-dev volume mount

Add `./docker_volumes/domain:/var/www/html/domain` to the `majora_proxy` service's volumes in `docker-compose.yml`, alongside the existing `./docker_volumes/photos:/var/www/html/photos` / `./docker_volumes/files:/var/www/html/files` mounts (`docker-compose.yml:101-102`). Add `docker_volumes/domain/` to `.gitignore`, alongside the matching `docker_volumes/photos/` / `docker_volumes/files/` entries (`.gitignore:34-35`). No Makefile/setup-script changes needed — like `photos`/`files`, the directory is created on first `docker-compose up` if it doesn't already exist.

## Files to Change

- `.circleci/config.yml` — new `link_domain` job + workflow wiring
- `docker-compose.yml` — new volume mount on `majora_proxy`
- `.gitignore` — new `docker_volumes/domain/` entry

## Notes

- No dedicated CI job validates `.circleci/config.yml`/`docker-compose.yml` syntax in this repo beyond CircleCI's own config parsing at pipeline-trigger time — no `## CI Checks` entry applies here.
