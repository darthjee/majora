# Project Instructions

Majora is an RPG campaign management system. It allows users to organize tabletop RPG sessions by registering games/campaigns and their associated content: player characters (PCs), non-player characters (NPCs), locations, quests, diary entries, links, and images.

## Stack

**Backend**
- Python 3.11
- Django 5 + Django REST Framework
- MySQL 8
- Gunicorn (production server)
- Poetry (dependency management)
- pytest + pytest-django (tests)
- ruff (linting, line length 100)

**Frontend**
- React 19 + React Bootstrap 5
- Vite (build tool)
- Jasmine + c8 (tests and coverage)
- ESLint (linting)
- Yarn (package manager)

**Infrastructure**
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

## Conventions

- All documentation and code comments must be written in **English**.
- Backend code lives in `source/`, frontend in `frontend/`.
- Django apps are organized under `source/` (e.g. `source/games/`).
- Frontend JS/JSX lives under `frontend/assets/js/`, specs under `frontend/spec/`.
- Max line length: 100 characters (backend); enforced by ruff.
- Keep backend views thin — business logic belongs in models or serializers.

## Documentation

All project documentation lives under [`docs/agents/`](docs/agents/):

| File | Contents |
|------|----------|
| [Folder Structure](docs/agents/folder-structure.md) | Top-level directory layout and the role of each folder. |
| [Architecture](docs/agents/architecture.md) | Source layout, modules, code style, and implementation guidelines. |
| [Flow](docs/agents/flow.md) | Main runtime flow of the application. |
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
