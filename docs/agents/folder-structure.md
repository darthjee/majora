# Folder Structure

## Project Root

| Directory / File | Description |
|-----------------|-------------|
| `backend/` | Django backend application (Python). |
| `frontend/` | React 19 + Vite application — UI components, assets, specs, and build output. |
| `proxy/` | PHP Tent proxy configuration (dev and prod routing rules) and custom middleware with PHPUnit tests. |
| `crawler/` | STL-site crawler client (Node.js). Currently a bare scaffold (`package.json`, `README.md`) — no crawling logic yet; owned by the `crawler` agent. |
| `dockerfiles/` | Dockerfiles for each service image (backend, frontend, production variants). |
| `docker_volumes/` | Bind-mounted volumes used by Docker services (static assets, proxy cache, node_modules, etc.). |
| `docs/` | Project documentation for agents and contributors, plus `docs/guides/` — public API documentation for external/automated consumers (not agents). |
| `bin/` | Standalone shell scripts shared across CI jobs regardless of language/runtime (`image.sh`, `deploy_frontend.sh`). |
| `scripts/` | Standalone shell scripts for releases (`bump_version.sh`, `deploy.sh`, `render.sh`). |
| `.circleci/` | CircleCI pipeline config (`config.yml`) and Navi cache-warmer config (`navi_config.yaml`). |
| `.claude/` | Claude Code project configuration: custom agents, slash commands, and skill state. |
| `.github/` | GitHub PR/commit message templates and Copilot instructions pointer. |
| `navi/` | Navi cache-warmer config (`navi_config.yaml`) and per-endpoint YAML resources, run as the `majora_navi` service to warm the proxy cache after release. |
| `Makefile` | Common development commands (`make dev-up`, `make tests`, `make setup`, etc.). |
| `docker-compose.yml` | Full stack service definitions (app, frontend, proxy, MySQL, Navi cache warmer). |
| `version` | Pinned base-image versions (`majora-base`, `circleci_majora-base`, `vite_majora-base`) used to tag/build shared Docker base images. |
| `README.md` | Project overview. |
| `LICENSE` | Project license. |

## `backend/` — Backend

| Subdirectory / File | Description |
|---------------------|-------------|
| `games/` | Django app managing campaigns, characters (PCs/NPCs), locations, quests, links, and photos. |
| `majora_project/` | Django project settings and root URL configuration. |
| `bin/` | Management or utility scripts. |
| `manage.py` | Django management entry point. |
| `pyproject.toml` | Python dependencies and tool configuration (Poetry, ruff, pytest). |

## `frontend/` — Frontend

| Subdirectory / File | Description |
|---------------------|-------------|
| `assets/` | Static source files: JS/JSX components (`assets/js/`), CSS (`assets/css/`), images (`assets/images/`). |
| `specs/` | Jasmine test files for frontend components (mirrors `assets/js/` structure). |
| `index.html` | Vite HTML entry point. |
| `vite.config.js` | Vite build configuration. |
| `eslint.config.mjs` | ESLint configuration. |

## `docker_volumes/` — Mounted Volumes

| Subdirectory | Description |
|--------------|-------------|
| `proxy_configuration/` | Nginx/proxy configuration files served by the `tent` proxy image. |
| `static/` | Built frontend assets (Vite output) served by the proxy. |

## `.claude/` — Claude Code Configuration

| Subdirectory | Description |
|--------------|-------------|
| `agents/` | Specialist subagent definitions (`architect`, `backend`, `frontend`, `infra`). |
| `commands/` | Custom slash commands for the Majora issue/plan/fix workflow. |

## `docs/agents/` — Documentation

| Subdirectory / File | Description |
|---------------------|-------------|
| `access-control.md` | Short index for the access control reference — links to every file under `access-control/`, plus the "Adding a new model" guidance. |
| `access-control/` | One file per resource/topic (`game.md`, `character.md`, `treasure.md`, `endpoints.md`, `versioning.md`, ...) documenting exactly who can read/write which fields and endpoints for that resource. Split out of the former monolithic `access-control.md` so an agent only loads the resource it's touching. |
| `external/` | Reference docs for third-party tools used by the project but not maintained here — `how-to-use-tent.md` (Tent reverse proxy, now a hub page — see `tent/` below) and `HOW_TO_USE_NAVI.md` (Navi cache warmer, now a hub page — see `navi/` below). Kept separate from internal architecture docs so it's obvious what's project-specific vs. third-party reference. |
| `external/navi/` | Per-topic Navi reference pages (`prerequisites.md`, `option-a-docker.md`, `option-b-nodejs.md`, `option-c-circleci.md`, `html-assets.md`, `paginated-actions.md`, `splitting-config.md`, `reference.md`). Split out of the former monolithic `HOW_TO_USE_NAVI.md` so an agent only loads the page it needs. |
| `external/tent/` | Per-topic Tent proxy reference pages (`quick-start.md`, `configuration-folder-layout.md`, `defining-rules.md`, `request-handlers.md`, `host-header.md`, `middlewares.md`, `cache-configuration.md`, `frontend-dev-mode.md`, `static-files.md`, `complete-example.md`, `extending-tent.md`, `reference.md`). Split out of the former monolithic `how-to-use-tent.md` so an agent only loads the page it needs. |
| `issues/` | Detailed specs for open/closed issues, one file per issue. |
| `migration/` | Temporary — tracks the app-wide migration of mutation requests onto `RequestStore`. Deleted once the last route in its checklist is migrated. |
| `plans/` | Implementation plans for ongoing or upcoming features, one directory per issue. |
| `architecture.md`, `flow.md`, `folder-structure.md`, `product.md`, `pagination.md`, `i18n.md`, `security-guidelines.md`, `views-organization.md`, `frontend.md`, `cache-warmer.md`, `contributing.md`, `crawler.md` | Other top-level internal reference docs — stay at the top level of `docs/agents/`; this reorg introduces only the two subfolders above, it does not regroup the rest. |

## `dockerfiles/` — Service Images

One directory per service image (dev and production backend, dev and production Vite,
CircleCI base), each with a `-base` variant shared by its dev/production counterpart where
applicable. See `ls dockerfiles/` for the current list.
