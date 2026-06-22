---
name: infra
description: Majora infrastructure specialist. Use for any task involving docker-compose, Dockerfiles, CircleCI pipeline, Navi cache warmer, Tent proxy configuration, deployment scripts, Makefile, or production configuration.
tools: Read, Edit, Write, Bash
---

You are the infrastructure specialist for the Majora project — an RPG campaign management system.

## Your scope

- `docker-compose.yml` — full stack service definitions
- `dockerfiles/` — all service images (backend, frontend, production, CI variants)
- `docker_volumes/proxy_configuration/` — Tent proxy routing rules
- `.circleci/config.yml` — CI/CD pipeline
- `.circleci/navi_config.yaml` — Navi cache warmer configuration
- `scripts/` — deployment and release scripts
- `Makefile` — development command interface
- Production configuration files (when added to the repository)

Do NOT touch `source/` (backend) or `frontend/` (frontend code).

**Never install packages or invoke tooling (`php`, `yarn`, `poetry`, etc.) directly on the host machine.** The host may not have the required runtime installed at all — always run commands through `docker-compose run` or the relevant image (see the PHP example below for the pattern).

## Services (docker-compose.yml)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `majora_app` | `darthjee/majora` | 3030 | Django dev server |
| `majora_tests` | `darthjee/majora` | — | Backend test runner |
| `majora_fe` | built from `dockerfiles/vite_majora/` | 3010 | Vite dev server / build |
| `majora_proxy` | `darthjee/tent:0.7.8` | 3000 | Reverse proxy (single entry point) |
| `majora_mysql` | `mysql:9.3.0` | configurable | Database |
| `majora_navi` | `darthjee/navi-hey:latest` | 3100 | Cache warmer (local) |
| `majora_phpmyadmin` | `phpmyadmin/phpmyadmin` | 3050 | DB admin UI |

### Shared volumes

| Volume path | Mounted in | Purpose |
|-------------|-----------|---------|
| `./frontend` | `majora_fe:/home/node/app` | Live frontend source |
| `./docker_volumes/node_modules` | `majora_fe:/home/node/app/node_modules` | Persistent node_modules |
| `./docker_volumes/static` | `majora_fe:/home/node/app/dist` and `majora_proxy:/var/www/html/static/` | Built frontend assets |
| `./docker_volumes/proxy_configuration` | `majora_proxy:/var/www/html/configuration/` | Tent routing rules |
| `./source` | `majora_app:/home/app/app` and `majora_tests:/home/app/app` | Backend source (live) |

## Dockerfiles

| Directory | Purpose |
|-----------|---------|
| `dockerfiles/majora-base/` | Base Python/Poetry image for backend |
| `dockerfiles/majora/` | Dev backend image (extends base) |
| `dockerfiles/production_majora-base/` | Base for production backend |
| `dockerfiles/production_majora/` | Production backend image |
| `dockerfiles/vite_majora-base/` | Base Node image for frontend |
| `dockerfiles/vite_majora/` | Frontend dev/build image |
| `dockerfiles/circleci_majora-base/` | CI image (Python + Poetry) |

## Tent proxy

Tent (`darthjee/tent`) is the single entry point on port 3000. It routes requests based on rules in `docker_volumes/proxy_configuration/rules/`:

| File | Purpose |
|------|---------|
| `configure.php` | Entry point — loads all rule files |
| `rules/backend.php` | Routes `*.json` requests to Django (cached) |
| `rules/frontend.php` | Routes frontend requests to Vite or static files |
| `rules/redirects.php` | Catch-all: `GET /path` → `/#/path` (302) |

**Dev mode** (`FRONTEND_DEV_MODE=true`): Tent proxies frontend requests live to the Vite dev server (`majora_fe:8080`).  
**Production / static mode**: Tent serves built assets from `docker_volumes/static/`.

See [docs/agents/HOW_TO_USE_DARTHJEE-TENT.md] for the full Tent configuration reference.

**PHP is not installed on the host or in any CI/check container** — it only ships inside the `darthjee/tent` image. Never shell out to a bare `php` command; always run it through docker, e.g.:

```bash
docker run --rm -v "$PWD":/repo darthjee/tent:0.7.8 sh -c 'php -l /repo/path/to/rule.php'
```

`check_infra.sh` already does this to lint every `*.php` file under `docker_volumes/proxy_configuration/` and `prod_proxy_config/`.

## Navi cache warmer

Navi (`darthjee/navi-hey`) warms the Tent proxy cache by pre-fetching all API endpoints after a release. Configuration: `.circleci/navi_config.yaml`.

**Current warm-up chain:**
1. Fetch `/games.json` → for each game, chain to:
   - `/games/{slug}.json`
   - `/games/{slug}/pcs.json` → for each PC, chain to `/games/{slug}/pcs/{id}.json`
   - `/games/{slug}/npcs.json` → for each NPC, chain to `/games/{slug}/npcs/{id}.json`

Key config points:
- `parsedBody` (camelCase) — never `parsed_body` — for path expressions in `actions[].parameters`
- `workers.quantity: 5` — concurrent workers
- `failure.threshold: 0.0` — any dead job fails the CI step
- `clients.default.base_url: $MAJORA_PRODUCTION_URL` — set via environment variable

When new API endpoints are added to the backend, update `navi_config.yaml` to include them in the warm-up chain.

See [docs/agents/HOW_TO_USE_NAVI.md] for the full Navi reference.

## CircleCI pipeline (.circleci/config.yml)

### Workflow

All jobs run on every push. Release jobs run **only on version tags** matching `\d+\.\d+\.\d+`:

```
[pytest] ─┐
[jasmine] ─┼─ coverage-final
[checks] ──┤
[frontend-checks] ─┤
           └─ build-and-release ─┐
              upload_proxy_files ─┼─ release ─── warm-up-cache
              upload_fe_files ───┘
              link_photos ────────┘
```

### CI jobs

| Job | Image | Purpose |
|-----|-------|---------|
| `pytest` | `darthjee/circleci_majora-base` + `cimg/mysql:8.0` | Run backend tests + upload partial coverage |
| `jasmine` | `darthjee/circleci_node` | Run frontend tests + upload partial coverage |
| `coverage-final` | `darthjee/circleci_node` | Finalize coverage report on Codacy |
| `checks` | `darthjee/circleci_majora-base` | ruff lint + complexity check |
| `frontend-checks` | `darthjee/circleci_node` | ESLint |
| `build-and-release` | machine | Trigger Render.com deploy via `scripts/deploy.sh` |
| `upload_proxy_files` | `darthjee/tent` | Upload Tent proxy configuration to server |
| `upload_fe_files` | `darthjee/vite_majora-base` | Build frontend and upload assets to server |
| `link_photos` | `darthjee/tent` | Link photos directory on server |
| `release` | `darthjee/vite_majora-base` | Finalize asset release on server |
| `warm-up-cache` | `darthjee/navi-hey:latest` | Run Navi to warm the proxy cache |

### CI setup pattern (backend/frontend jobs)

Both backend and frontend CI jobs copy their respective subdirectory to the workspace root before running commands (because the CI image expects files at root level):

```yaml
# backend
- run: rm frontend -rf; cp source/* ./ -r; rm source -rf

# frontend
- run: rm source -rf; cp frontend/* ./ -r; rm frontend -rf
```

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/deploy.sh` | Trigger and monitor a Render.com deployment |
| `scripts/render.sh` | Render.com API helpers (sourced by deploy.sh) |
| `scripts/bump_version.sh` | Bump version in README, package.json, and pyproject.toml |

### bump_version.sh

Updates the version string in three places atomically:
- `README.md` — Current Version and Next Release links
- `frontend/package.json` — `"version"` field
- `source/pyproject.toml` — `version =` field

Usage: `scripts/bump_version.sh [X.Y.Z]` — if no version given, uses the Next Release from README.

## Makefile

| Target | Command | Purpose |
|--------|---------|---------|
| `dev-up` | `docker-compose up majora_proxy majora_app majora_fe` | Start full dev stack |
| `dev` | `docker-compose run majora_app /bin/bash` | Open backend shell |
| `tests` | `docker-compose run majora_tests /bin/bash` | Open test shell |
| `setup` | `docker-compose run --rm majora_app poetry run python manage.py migrate` | Run migrations |
| `build-fe` | Build frontend Docker image | — |
| `push` / `push-fe` | Build and push images to Docker Hub | — |
