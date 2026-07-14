# Project Instructions

Majora is an RPG campaign management system. It allows users to organize tabletop RPG sessions by registering games/campaigns and their associated content: player characters (PCs), non-player characters (NPCs), locations, quests, diary entries, links, and images.

## Stack

### Backend

- Python 3.11
- Django 5 + Django REST Framework
- MySQL 8
- Gunicorn (production server)
- Poetry (dependency management)
- pytest + pytest-django (tests)
- ruff (linting, line length 100)

### Frontend

- React 19 + React Bootstrap 5
- Vite (build tool)
- Jasmine + c8 (tests and coverage)
- ESLint (linting)
- Yarn (package manager)

### Infrastructure

- Docker + Docker Compose
- Reverse proxy via `darthjee/tent`

## Development

```bash
# Start the full stack (proxy + backend + frontend)
make dev-up

# Open a backend shell
make dev

# Open a test shell
make tests

# Run Django migrations
make setup
```

Backend runs on port `3030`, frontend dev server on `3010`, full stack proxy on `3000`.

**Always run project commands through `docker-compose`.** (unless the user says otherwise).
Never install packages or invoke tooling (`yarn`, `npm`, `poetry`, `pip`, `php`, etc.) directly on the host machine (unless the users says otherwise).
the host may not even have the required runtime installed, and dependencies must stay reproducible inside the project's containers. Examples:

```bash
docker-compose run --rm majora_fe yarn lint
docker-compose run --rm majora_tests pytest
```

## Conventions

- All documentation and code comments must be written in **English**.
- Backend code lives in `backend/`, frontend in `frontend/`.
- Django apps are organized under `backend/` (e.g. `backend/games/`).
- Frontend JS/JSX lives under `frontend/assets/js/`, specs under `frontend/specs/`.
- Max line length: 100 characters (backend); enforced by ruff.
- Keep backend views thin — business logic belongs in models or serializers.

## Documentation

All project documentation lives under [`docs/agents/`](docs/agents/):

| File | Contents |
|------|----------|
| [Folder Structure](docs/agents/folder-structure.md) | Top-level directory layout and the role of each folder. |
| [Architecture](docs/agents/architecture.md) | Source layout, modules, code style, and implementation guidelines. |
| [Views Organization](docs/agents/views-organization.md) | Folder convention for `backend/games/views/` (and its mirrored test tree): plural resource folders, nested `game/` sub-resources, `detail/` member actions. |
| [Contributing](docs/agents/contributing.md) | Commit guidelines, PR standards, code organization, and refactoring rules. |
| [Flow](docs/agents/flow.md) | Main runtime flow of the application. |
| [Product Definitions](docs/agents/product.md) | Authoritative product-level concepts: entity definitions, ownership chain, GameMaster role, and editing rules. Consult before planning any issue that introduces new entities or changes access logic. |
| [Access Control](docs/agents/access-control.md) | Per-role access rules for every model and endpoint; updated alongside any new model or endpoint. |
| [Security Guidelines](docs/agents/security-guidelines.md) | Project-specific vulnerability patterns (auth gaps, injection, insecure headers, exposed secrets, CSRF, insecure proxy rules, input validation); used by the `security` agent. |
| [Cache Warmer](docs/agents/cache-warmer.md) | Navi setup for warming the proxy cache after release (CI and local). |
| [Frontend i18n](docs/agents/i18n.md) | Frontend translation layer: YAML files, `Translator`, language selector, and how to add a new language. |
| [How to Use Navi](docs/agents/external/HOW_TO_USE_NAVI.md) | Full Navi reference: config format, chaining, pagination, CLI flags. |
| [Plans](docs/agents/plans/) | Implementation plans for ongoing or upcoming features. |
| [Issues](docs/agents/issues/) | Detailed specs for open issues. |

### Issues (`docs/agents/issues/`)

Each file documents an issue in detail. Naming convention:

```
docs/agents/issues/<issue_id>_<issue_name>.md
```

Example: `docs/agents/issues/5_release_docker_image.md` for issue #5.

### Plans (`docs/agents/plans/`)

Each plan is a directory named after the issue ID and topic, containing one or more related files:

```
docs/agents/plans/<issue_id>_<topic>/<related_files>.md
```

Example: `docs/agents/plans/12_add-auth/plan.md` for issue #12.
