# Plan: Rename source to backend

Issue: [481-rename-source-to-backend.md](../issues/481-rename-source-to-backend.md)

## Overview

Rename the top-level `source/` folder to `backend/` (via `git mv`, preserving history) to
match the existing `frontend/` naming convention, then update every reference to the old
path across CI, Docker, docs, and tooling config. The rename itself and the one internal
path fix inside the project's own `pyproject.toml` are `backend` agent work; every
Docker/CircleCI/Codacy/script reference to the folder is `infra` agent work. The remaining
references — root-level project docs, README, `.gitignore`, and the `.claude/agents/*.md`
specialist definitions — are cross-cutting/root-level files with no natural single owner
among the specialist agents, so the architect handles them directly (see "Root-level
changes" below) rather than as a third per-agent plan file.

## Agents involved

- [backend](backend.md)
- [infra](infra.md)

## Shared contracts

- **New folder path**: `source/` becomes `backend/`, with its internal structure unchanged
  (still contains `pyproject.toml`, `poetry.lock`, `manage.py`, `majora_project/`, `games/`,
  `conftest.py`, etc.). `infra`'s Docker/CI config must reference `./backend` /
  `backend/pyproject.toml` / `backend/poetry.lock*` instead of the `source/` equivalents —
  no other structural change to depend on.
- **Ordering**: `backend` should perform the `git mv source backend` first (or in the same
  change set); `infra`'s config changes are just path substitutions and don't depend on the
  Python content, so the two can be done independently as long as both land together (a
  half-renamed tree breaks the docker-compose volume mount and CI checkout).

## Root-level changes (architect)

These files reference the `source/` path but don't belong to `backend`'s or `infra`'s owned
directories — the architect updates them directly as part of this plan:

- `README.md` — directory tree listing (`source/` → `backend/`) and any prose mention.
- `AGENTS.md` — "Backend code lives in `source/`", "Django apps are organized under
  `source/`", and the Views Organization row's `source/games/views/` example path.
- `.gitignore` — `source/staticfiles/` → `backend/staticfiles/`.
- `docs/agents/architecture.md` — `## Backend (`source/`)` heading and body references.
- `docs/agents/folder-structure.md` — the `source/` row and the `## `source/` — Backend`
  heading.
- `docs/agents/views-organization.md` — every `source/games/views/...` example path.
- `docs/agents/contributing.md` — the `source/` row (including the `cd source && poetry run
  pytest --cov` command) and the "Backend (`source/`)" heading.
- `docs/agents/security-guidelines.md` — the `source/` and `proxy/` mention, and the example
  test file path.
- `docs/agents/pagination.md` — `source/games/settings.py` and `source/games/paginator.py`
  references.
- `docs/agents/product.md` — `source/games/models/character.py` reference.
- `docs/agents/access-control/common-rules.md`, `docs/agents/access-control/endpoints.md`,
  `docs/agents/access-control/user.md`, `docs/agents/access-control/character-link.md`,
  `docs/agents/access-control/character.md` — each `source/games/...` example path.
- `.claude/agents/architect.md`, `backend.md`, `frontend.md`, `infra.md`, `proxy.md`,
  `security.md`, `data-access.md` — every `source/` scope/example reference (each
  specialist's own file describes `source/` as backend's owned directory or as a
  "do not touch" boundary; since these are root-level meta-config rather than files any one
  specialist edits as part of their own domain, the architect updates all of them together
  for consistency).

Note: `.claude/settings.local.json` contains several historical Bash permission-allowlist
entries with literal old `source/...` paths (e.g. `Bash(python -m flake8
source/games/migrations/0017_upload.py)`). These are a record of previously-approved
commands, not live routing config — leave them as-is; they simply won't match future
`backend/...` commands and will accumulate fresh entries naturally.

## CI Checks

- `backend` (post-rename): `cd backend && poetry run pytest --cov` and `poetry run ruff check .`
  (CI job: backend test/lint jobs in `.circleci/config.yml`, `working_directory: ~/project/backend`)
- Root: no dedicated lint/test job covers README/docs/`.gitignore`/`.claude/agents/*.md`: verify
  manually by grepping for leftover `source/` path references after the change.

## Notes

- No `frontend/`, `proxy/`, `data-access`, `product-owner`, `security`, or `translator` work
  is required — none of those own files reference the `source/` path in a way that changes
  behavior (frontend and proxy code have no build/runtime dependency on the backend folder
  name).
- `scripts/deploy.sh`'s `source "scripts/render.sh"` is the Bash builtin `source` command,
  unrelated to the folder — do not touch it.
