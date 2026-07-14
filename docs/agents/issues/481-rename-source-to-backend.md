# Issue: Rename source to backend

## Description
Rename the top-level `source/` folder to `backend/`, to match the existing `frontend/` naming convention. `source` is a generic name that doesn't communicate the folder's role (it holds the Django backend), whereas `backend`/`frontend` form a clear, symmetric pair.

## Problem
The name `source` is ambiguous and inconsistent with the sibling `frontend/` folder. Every place that references the folder path — CI config, Docker build contexts and volumes, docs, scripts, ignore rules, and Claude agent definitions — needs to be updated together, or the rename will break builds, tests, or agent tooling.

## Solution
Rename `source/` to `backend/` (via `git mv` to preserve history) and update every reference to the old path, including but not limited to:

- `.circleci/config.yml`
- `dockerfiles/` (build contexts, COPY paths)
- `docker-compose.yml` (volumes, working directories)
- `docs/agents/` (architecture, folder-structure, and other docs describing the layout)
- `.gitignore`
- `README.md`
- `scripts/`
- `.codacy.yml`
- `.claude/agents/*.md` (agent scope descriptions reference `source/`)
- `source/pyproject.toml` internal path references (e.g. coverage `exclude_dirs`)

## Benefits
- Consistent, self-explanatory naming alongside `frontend/`
- Removes ambiguity between "source code" (generic term) and the specific backend project folder
