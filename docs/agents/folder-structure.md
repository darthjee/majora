# Folder Structure

## Project Root

| Directory / File | Description |
|-----------------|-------------|
| `source/` | Django backend application (Python). |
| `frontend/` | React 19 + Vite application — UI components, assets, specs, and build output. |
| `proxy/` | PHP Tent proxy configuration (dev and prod routing rules) and custom middleware with PHPUnit tests. |
| `dockerfiles/` | Dockerfiles for each service image (backend, frontend, production variants). |
| `docker_volumes/` | Bind-mounted volumes used by Docker services (static assets, proxy cache, node_modules, etc.). |
| `docs/` | Project documentation for agents and contributors. |
| `bin/` | Standalone shell scripts shared across CI jobs regardless of language/runtime (`image.sh`, `deploy_frontend.sh`). |
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

One directory per service image (dev and production backend, dev and production Vite,
CircleCI base), each with a `-base` variant shared by its dev/production counterpart where
applicable. See `ls dockerfiles/` for the current list.
