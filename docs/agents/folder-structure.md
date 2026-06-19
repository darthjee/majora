# Folder Structure

## Project Root

| Directory / File | Description |
|-----------------|-------------|
| `source/` | Django backend application (Python). |
| `frontend/` | React 19 + Vite application — UI components, assets, specs, and build output. |
| `dockerfiles/` | Dockerfiles for each service image (backend, frontend, production variants). |
| `docker_volumes/` | Bind-mounted volumes used by Docker services (static assets, proxy config, node_modules, etc.). |
| `docs/` | Project documentation for agents and contributors. |
| `prod_proxy_config/` | Production proxy host configuration (PHP-based rules and host definitions for `darthjee/tent`). |
| `scripts/` | Standalone shell scripts for releases (`bump_version.sh`, `deploy.sh`, `render.sh`). |
| `.circleci/` | CircleCI pipeline config (`config.yml`) and Navi cache-warmer config (`navi_config.yaml`). |
| `.claude/` | Claude Code project configuration: custom agents, slash commands, and skill state. |
| `.github/` | GitHub PR/commit message templates and Copilot instructions pointer. |
| `Makefile` | Common development commands (`make dev-up`, `make tests`, `make setup`, etc.). |
| `docker-compose.yml` | Full stack service definitions (app, frontend, proxy, MySQL, Navi cache warmer). |
| `README.md` | Project overview. |
| `LICENSE` | Project license. |

## `source/` — Backend

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

## `dockerfiles/` — Service Images

| Subdirectory | Description |
|--------------|-------------|
| `majora/` | Development image for the Django backend. |
| `majora-base/` | Base image shared by backend images. |
| `production_majora/` | Production-optimised backend image. |
| `production_majora-base/` | Base image shared by production images. |
| `vite_majora/` | Image for running the Vite dev server / build. |
| `vite_majora-base/` | Base image for the Vite container. |
| `circleci_majora-base/` | Base image used in CI pipelines. |
