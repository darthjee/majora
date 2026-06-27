# Architecture

## Overview

Majora is structured as two independent applications — a Django REST backend and a React/Vite frontend — served together through the Tent proxy. The backend owns all data and business logic; the frontend is a purely static single-page application that consumes the backend API. Tent is the single entry point: it routes requests to the correct upstream and caches backend responses.

## Tent Proxy (`majora_proxy`)

Tent ([GitHub](https://github.com/darthjee/tent), [Docker Hub](https://hub.docker.com/r/darthjee/tent)) is a PHP-based reverse proxy and static file server. It listens on port 3000 and is the only service exposed to end users. See [HOW_TO_USE_DARTHJEE-TENT.md](HOW_TO_USE_DARTHJEE-TENT.md) for the full configuration reference.

All proxy-related files live under the top-level `proxy/` directory:

```
proxy/
├── dev_configuration/   # dev routing rules (mounted into Tent at /var/www/html/configuration/)
│   ├── configure.php    # entry point — loads all rule files
│   └── rules/
│       ├── backend.php  # routes *.json requests to the Django backend (cached)
│       ├── frontend.php # routes frontend requests (dev server or static files)
│       └── redirects.php# catch-all redirect: GET /path → /#/path
├── prod_configuration/  # production routing rules (uploaded to the remote server)
└── custom/
    ├── extend/          # custom Tent middleware PHP classes (Tent\ namespace)
    └── tests/           # PHPUnit tests for custom middleware
```

### Development mode (`FRONTEND_DEV_MODE=true`)

Tent proxies live frontend requests directly to the Vite dev server (`majora_fe:8080`). HMR works end-to-end:

| Path pattern | Handler |
|---|---|
| `GET /` | Vite dev server |
| `GET /assets/js/*` | Vite dev server |
| `GET /assets/css/*` | Vite dev server |
| `GET /assets/images/*` | Vite dev server |
| `GET /@vite/*` | Vite dev server (HMR) |
| `GET /node_modules/*` | Vite dev server |
| `GET /@react-refresh` | Vite dev server (HMR) |
| `GET /*.json` | Django backend (cached, `default_proxy`) |
| `GET /<path>` (no match) | Redirected to `/#/<path>` (302) |

### Production / static mode (`FRONTEND_DEV_MODE=false` or unset)

Tent serves all frontend assets from its static folder:

| Path pattern | Handler |
|---|---|
| `GET /` | Serves `/index.html` statically (via `SetPathMiddleware`) |
| `GET /assets/*` | Served statically from `/var/www/html/static` |
| `GET /*.json` | Django backend (cached, `default_proxy`) |
| `GET /<path>` (no match) | Redirected to `/#/<path>` (302) |

## Shared Volume: Frontend Build Output

`docker_volumes/static/` is mounted into both `majora_fe` and `majora_proxy`:

- In `majora_fe`: mounted as `/home/node/app/dist` — Vite's `outDir`, so `npm run build` writes here.
- In `majora_proxy`: mounted into `/var/www/html/static/` — Tent serves these files directly.

This means a frontend build is immediately available to Tent without any copy step.

## Backend (`source/`)

All Django source code lives under `source/`.

### `majora_project/`

Django project package: `settings.py`, root `urls.py`, `wsgi.py`. Entry point for the Django application.

### `games/`

The core Django app. Contains all domain models, REST views, and serializers for RPG campaign data.

- `models.py` — Domain models: `Game`, `Player`, `Character`, `Photo`, `Link`.
- `views/` — Function-based API views using `@api_view` (`games.py`, `characters.py`).
- `serializers.py` — DRF serializers (list and detail variants per resource).
- `paginator.py` — Custom pagination for list endpoints. See [pagination.md](pagination.md).
- `urls.py` — URL routing for the games app.
- `migrations/` — Django database migrations.
- `tests/` — Unit and integration tests.
- `admin.py` — Django Admin registrations.

### API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/games.json` | List all games |
| `GET` | `/games/<slug>.json` | Game detail (includes links) |
| `GET` | `/games/<slug>/pcs.json` | Player Characters for a game |
| `GET` | `/games/<slug>/npcs.json` | Non-Player Characters for a game |
| `GET` | `/games/<slug>/pcs/<id>.json` | PC detail (includes photos) |
| `GET` | `/games/<slug>/npcs/<id>.json` | NPC detail (includes photos) |

### Domain Models

| Model | Key fields | Notes |
|-------|-----------|-------|
| `Game` | `name`, `game_slug`, `photo`, `description` | Slug auto-generated from name |
| `Player` | `name`, `games` (M2M) | Human player; linked to one or more games |
| `Character` | `name`, `game`, `player`, `avatar_url`, `character_class`, `level`, `description`, `npc` | PC if `npc` is `False`; NPC if `npc` is `True` (default) |
| `Photo` | `url`, `character` (FK) | Image gallery entry for a character |
| `Link` | `text`, `url`, `game` (FK) | External link related to a game |

## Frontend (`frontend/`)

All React source code lives under `frontend/`. See [frontend.md](frontend.md) for the full component architecture, conventions, and how to add new pages and elements.

### `assets/`

Static asset sources — CSS (`assets/css/`), JavaScript/JSX (`assets/js/`), and images (`assets/images/`).

### `specs/`

Jasmine test files. Mirror the `assets/js/` directory structure.

### Frontend test commands

From `/frontend`:

- `npm test` — run Jasmine specs under `specs/`
- `npm run coverage` — generate frontend coverage with `c8`
- `npm run lint` — lint frontend source and specs

### `index.html`

SPA entry point consumed by Vite.

### `vite.config.js`

Vite bundler configuration.

## Product Definitions and the Product Owner Agent

Product-level concepts — entity definitions, the ownership chain, GameMaster role, and
editing rules — are documented in [`docs/agents/product.md`](product.md). This is the
single source of truth for domain semantics, independent of ORM details.

The **product-owner** agent (`.claude/agents/product-owner.md`) is a read-only agent
whose primary reference is `docs/agents/product.md`. The architect invokes it **before
planning** any issue that:

- Introduces a new entity or endpoint.
- Changes access rules, ownership logic, or role definitions.
- Requires understanding who can see or edit what.

When `docs/agents/product.md` is updated (e.g. a new entity is introduced), update
`docs/agents/access-control.md` in the same PR.
