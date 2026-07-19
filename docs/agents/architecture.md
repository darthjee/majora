# Architecture

## Overview

Majora is structured as two independent applications — a Django REST backend and a React/Vite frontend — served together through the Tent proxy. The backend owns all data and business logic; the frontend is a purely static single-page application that consumes the backend API. Tent is the single entry point: it routes requests to the correct upstream and caches backend responses.

## Tent Proxy (`majora_proxy`)

Tent ([GitHub](https://github.com/darthjee/tent), [Docker Hub](https://hub.docker.com/r/darthjee/tent)) is a PHP-based reverse proxy and static file server. It listens on port 3000 and is the only service exposed to end users. See [HOW_TO_USE_DARTHJEE-TENT.md](external/HOW_TO_USE_DARTHJEE-TENT.md) for the full configuration reference.

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

### Routing modes

In dev mode (`FRONTEND_DEV_MODE=true`), Tent proxies frontend requests directly to the Vite
dev server (`majora_fe:8080`), including HMR paths (`/@vite/*`, `/@react-refresh`), so HMR
works end-to-end. In production (or when the flag is unset), Tent instead serves frontend
assets statically from its own static folder. Both modes share the same two remaining
rules: any `*.json` path is routed to the Django backend (cached, `default_proxy`), and any
other unmatched path is redirected to `/#/<path>` (302) — the SPA hash-routing catch-all.
See `proxy/dev_configuration/rules/` and `proxy/prod_configuration/` for the exact rule
definitions.

## Shared Volume: Frontend Build Output

`docker_volumes/static/` is mounted into both `majora_fe` and `majora_proxy`:

- In `majora_fe`: mounted as `/home/node/app/dist` — Vite's `outDir`, so `npm run build` writes here.
- In `majora_proxy`: mounted into `/var/www/html/static/` — Tent serves these files directly.

This means a frontend build is immediately available to Tent without any copy step.

## Backend (`backend/`)

All Django source code lives under `backend/`.

### `majora_project/`

Django project package: `settings.py`, root `urls.py`, `wsgi.py`. Entry point for the Django application.

### `games/`

The core Django app. Contains all domain models, REST views, and serializers for RPG campaign data.

- `models/` — Domain models (see `AGENTS.md` for the current list).
- `views/` — Function-based API views using `@api_view`, one file per view/route. Folder layout follows the convention documented in [views-organization.md](views-organization.md) (currently mid-migration — see that doc's "Adoption status"); shared auth/validation/pagination/access helpers live in `views/common.py`.
- `serializers/` — DRF serializers (one class per file): `game_access.py` (`GameAccessSerializer`), `character_access.py` (`CharacterAccessSerializer`), `pc_access.py` (`PcAccessSerializer`), plus list/detail/update serializers per resource.
- `paginator.py` — Custom pagination for list endpoints. See [pagination.md](pagination.md).
- `urls.py` — URL routing for the games app.
- `migrations/` — Django database migrations.
- `tests/` — Unit and integration tests.
- `admin.py` — Django Admin registrations.

See root [`AGENTS.md`](../../AGENTS.md) for the current API endpoint list and domain model
summary; `backend/games/urls.py` and `backend/games/models/` are the authoritative source.

### `accounts/`

Account/authentication Django app — every `/users/*.json` endpoint (login, logout, register,
status, my-account get/update, language preference, test-email, password recovery/reset), kept
separate from `games`' gameplay domain (games, characters, treasures, ...).

- `models/` — `UserProfile` (favorite language, display name, Gravatar email hash) and
  `PasswordResetToken` (single-use password recovery tokens). Both moved here from `games` as a
  migration-*state*-only change: their MySQL tables remain `games_userprofile` and
  `games_passwordresettoken` (set via an explicit `Meta.db_table` on each model), so no data
  migration or table rename was needed.
- `views/auth/` — login, logout, register, status, account (get/update), language, test-email.
- `views/password_reset/` — recover (request a reset email), reset-password (consume a token).
- `serializers/auth/` — `MyAccountDetailSerializer`, `MyAccountUpdateSerializer`.
- `authentication.py` — `CookieTokenAuthentication`, the project's
  `DEFAULT_AUTHENTICATION_CLASSES`; used directly by most `games` views too (a `games` →
  `accounts` dependency, alongside `games.settings.Settings` and `games.gravatar
  .GravatarUrlBuilder`, which `accounts` depends on the other way).
- `account_uniqueness.py`, `url_builder.py` (`FrontendBaseUrl`) — helpers private to the
  registration/account-update and password-reset-email flows, respectively.
- `urls.py` — flat URL routing for every `/users/*.json` route (unlike `games/urls/`, `accounts`
  has only one group of routes, so no multi-file concatenation is needed).
- `templates/accounts/` — `welcome_email.txt`, `test_email.txt`, `password_reset_email.txt`.
- `migrations/`, `tests/` — same shape as `games`.

### `versioning/`

Cross-cutting change-history infrastructure, not game domain logic — the second top-level
Django app besides `games`. Wraps `django-simple-history` to keep full-state (not diff)
snapshots of every save/delete on the tracked `games` models: `Game`, `Player`, `Character`,
`Treasure`, `CharacterTreasure`, `GamePhoto`, `CharacterPhoto`, `Link`, `CharacterLink`,
`TreasurePhoto`, `GameItem`, `GameItemPhoto`, `CharacterItem`, and `CharacterItemPhoto` — added
via a `history = HistoricalRecords(app='versioning')` field on each model in `games/models/`.
`GameTreasure` is intentionally excluded from tracking.

- `HistoricalRecords(app='versioning')` routes each generated `Historical<Model>` table's
  migration into `versioning/migrations/` instead of `games/migrations/`, keeping the
  tracked models' own app free of history-table churn.
- `simple_history.middleware.HistoryRequestMiddleware` (registered in `MIDDLEWARE`, after
  `AuthenticationMiddleware`) captures the acting user as `history_user` on each historical
  row — including for DRF-authenticated requests, since DRF's `Request.user` property
  propagates the authenticated user back onto the underlying Django request before the
  view's model save runs.
- `admin.py` registers every `Historical<Model>` read-only (no add/change/delete), so history
  can be inspected in Django Admin without allowing edits to past snapshots.
- No new API endpoints or serializers are introduced; history is exposed only via Django
  Admin. Surfacing history through the API is a separate concern.

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
