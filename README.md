# majora
Repository for information for RP games

[![Build Status](https://circleci.com/gh/darthjee/majora.svg?style=shield)](https://circleci.com/gh/darthjee/majora)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/278660c8eee94fe88bd0cb08d21de71f)](https://app.codacy.com/gh/darthjee/majora/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/278660c8eee94fe88bd0cb08d21de71f)](https://app.codacy.com/gh/darthjee/majora/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)

![majora](https://raw.githubusercontent.com/darthjee/majora/master/majora.png)

**Current Version:** [0.3.2](https://github.com/darthjee/majora/releases/tag/0.3.2)

**Next Release:** [0.3.3](https://github.com/darthjee/majora/compare/0.3.2...main)

## About

Majora is an RPG campaign management system for tabletop roleplaying games. It allows users to organise campaigns by registering games and their associated content: player characters (PCs), non-player characters (NPCs), locations, quests, diary entries, links, and images.

The application is structured as a Django REST API backend and a React single-page application frontend, served together through the [Tent](https://github.com/darthjee/tent) reverse proxy.

## Technology Stack

**Backend**
- **Python 3.11 / Django 5** — Application framework
- **Django REST Framework** — API layer
- **MySQL 8** — Relational database
- **Gunicorn** — Production WSGI server
- **Poetry** — Dependency management
- **pytest + pytest-django** — Test suite
- **ruff** — Linting (max line length: 100)

**Frontend**
- **React 19 + React Bootstrap 5** — UI framework
- **Vite** — Build tool and dev server
- **Jasmine + c8** — Tests and coverage
- **ESLint** — Linting
- **Yarn** — Package manager

**Infrastructure**
- **Docker & Docker Compose** — Containerisation and orchestration
- **[darthjee/tent](https://github.com/darthjee/tent)** — Reverse proxy (port 3000)

## Project Structure

```
majora/
├── source/               # Django backend (Python)
│   ├── games/            # Core app: models, views, serializers, migrations
│   ├── majora_project/   # Django settings and root URL config
│   └── manage.py
├── frontend/             # React + Vite frontend
│   ├── assets/           # JS/JSX components, CSS, images
│   └── specs/            # Jasmine test files
├── dockerfiles/          # Dockerfiles for each service
├── docker_volumes/       # Bind-mounted volumes (static assets, proxy config)
├── docs/                 # Project documentation
└── docker-compose.yml    # Full stack service definitions
```

### API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/games.json` | List all games |
| `GET` | `/games/<slug>.json` | Game detail (includes links) |
| `GET` | `/games/<slug>/pcs.json` | Player Characters for a game |
| `GET` | `/games/<slug>/npcs.json` | Non-Player Characters for a game |
| `GET` | `/games/<slug>/characters/<id>.json` | Character detail (includes photos) |
| `POST` | `/users/login.json` | Authenticate and obtain a token |
| `POST` | `/users/register.json` | Create a new user account |
| `POST` | `/users/logout.json` | Revoke the current token (requires authentication) |

### Authentication

The API uses DRF token authentication. Obtain a token via `/users/login.json`, then send it in the `Authorization` header on subsequent requests.

```bash
# Register a new user
curl -X POST http://localhost:3000/users/register.json \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret123", "email": "alice@example.com"}'

# Log in to obtain a token
curl -X POST http://localhost:3000/users/login.json \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret123"}'
# => {"token": "<your-auth-token>"}

# Use the token on authenticated requests
curl -X POST http://localhost:3000/users/logout.json \
  -H "Authorization: Token <your-auth-token>"
```

## Development Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed

### First Time Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/darthjee/majora.git
   cd majora
   ```

2. Create the `.env` file and run database migrations:
   ```bash
   make setup
   ```

3. Review and adjust `.env` values if needed.

### Running the Application

```bash
# Start the full stack (proxy + backend + frontend dev server)
make dev-up
```

The application will be available at:
- **Full stack (proxy):** http://localhost:3000
- **Backend API:** http://localhost:3030
- **Frontend dev server:** http://localhost:3010

### Development Shells

```bash
# Open a backend shell
make dev

# Open a test shell
make tests
```

### Running Tests

Inside the backend shell (`make dev`):
```bash
poetry run pytest
```

Inside the test shell (`make tests`):
```bash
poetry run pytest
```

Frontend tests (from `frontend/`):
```bash
yarn test        # run Jasmine specs
yarn coverage    # generate coverage with c8
yarn lint        # lint source and specs
```
