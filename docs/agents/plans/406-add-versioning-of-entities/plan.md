# Plan: Add versioning of entities

Issue: [406-add-versioning-of-entities.md](../../issues/406-add-versioning-of-entities.md)

## Overview

Add change-tracking (full-state, per-version) to a defined set of `games` models using
`django-simple-history`, so each save produces a snapshot row in a dedicated `Historical<Model>`
table, tagged with the acting user. The tracking infrastructure (the library's own `simple_history`
app, settings, middleware) is isolated in a brand-new top-level Django app, `source/versioning/`,
kept separate from the `games` domain app.

## Context

From the issue: track `Game`, `Player`, `Character`, `Treasure`, `CharacterTreasure`, `GamePhoto`,
`CharacterPhoto`, `Link`, `CharacterLink`, and `TreasurePhoto` (`GameTreasure` is explicitly out of
scope). `django-simple-history` was chosen over `django-reversion` because it generates one
dedicated table per tracked model (e.g. `HistoricalGame`) instead of a single shared
generic-relation table, and it supports capturing the acting user via middleware.

## Implementation Steps

### Step 1 — Add the dependency

Add `django-simple-history` to `source/pyproject.toml` under `[tool.poetry.dependencies]` and
update the lock file (`poetry add django-simple-history` inside the `majora_app` container per
`AGENTS.md`'s rule of never running `poetry` on the host).

### Step 2 — Create the `versioning` app

Create `source/versioning/` as a standard Django app:
- `__init__.py`
- `apps.py` — `VersioningConfig(AppConfig)`, `name = 'versioning'`, `default_auto_field = 'django.db.models.BigAutoField'`
- `migrations/__init__.py`
- `admin.py` — placeholder for Step 5's read-only registrations
- `tests/__init__.py`

### Step 3 — Wire up settings

In `source/majora_project/settings.py`:
- Add `'simple_history'` (the library's own app, required for its base tables/migrations) and
  `'versioning'` to `INSTALLED_APPS`.
- Add `'simple_history.middleware.HistoryRequestMiddleware'` to `MIDDLEWARE` (after
  `AuthenticationMiddleware`) — required for `HistoricalRecords` to capture `request.user`
  automatically without passing it explicitly at every call site.

### Step 4 — Add `HistoricalRecords()` to the tracked models

Add a `history = HistoricalRecords()` field to each of the following models in
`source/games/models/`: `Game`, `Player`, `Character`, `Treasure`, `CharacterTreasure`,
`GamePhoto`, `CharacterPhoto`, `Link`, `CharacterLink`, `TreasurePhoto`.

Before doing so, check whether the pinned `django-simple-history` version's `HistoricalRecords`
constructor supports directing the generated historical model into a different app than the
tracked model (this capability has existed under an `app`/`app_label`-style kwarg in some
versions — verify the exact name against the installed version's own docs/changelog, do not
assume the name from memory). This is how the historical tables end up living under
`source/versioning/migrations/` instead of `source/games/migrations/`, keeping the isolation the
issue asks for.

- If supported: use it for all ten models.
- If not supported in the pinned version: keep the historical models colocated with `games`
  migrations for now, note this as a known limitation in the PR description, and do not block the
  issue on it — the per-entity-table and user-tracking requirements are still met either way.

### Step 5 — Migrations

Run `poetry run python manage.py makemigrations games versioning` (inside the container) to
generate the `Historical*` model migrations. Confirm the resulting migration files land under
`source/versioning/migrations/` (or `source/games/migrations/`, per Step 4's outcome).

### Step 6 — Admin registration (read-only)

Register each `Historical<Model>` in `source/versioning/admin.py` as read-only
(`has_add_permission`/`has_change_permission`/`has_delete_permission` all returning `False`), so
history can be inspected in Django Admin without allowing edits to past snapshots. This mirrors
`django-reversion`'s Admin-rollback convenience mentioned in the issue's research, scoped down to
read-only inspection since rollback UI is not a stated requirement.

### Step 7 — Update test/coverage configuration

In `source/pyproject.toml`:
- Extend `testpaths` to `["games/tests", "versioning/tests"]`.
- Extend `[tool.coverage.run]` `source` to `["games", "versioning"]`.

### Step 8 — Tests

Add tests under `source/versioning/tests/` (or alongside each model's existing test file under
`source/games/tests/models/`, whichever keeps history assertions closest to the model they cover —
follow the `test_*.py` naming already used in `games/tests/models/`) verifying, for at least a
representative subset of the ten tracked models:
- Saving/updating a tracked instance creates a new historical row with the full field state at
  that point in time (not a diff).
- Deleting a tracked instance is also captured (simple_history records deletions by default).
- When a request-bound user performs the change (e.g. via the Django test client hitting an
  existing authenticated endpoint), the historical row's `history_user` is set to that user.
- `GameTreasure` remains untracked (no `HistoricalGameTreasure` table/behavior).

Reuse existing factories from `source/games/tests/factories.py` for building the tracked
instances rather than duplicating setup.

### Step 9 — Documentation

Update `docs/agents/architecture.md`'s "Backend (`source/`)" section to list the new
`versioning/` app alongside `games/` and `majora_project/`, briefly describing its purpose
(cross-cutting change-history infrastructure, not game domain logic).

## Files to Change

- `source/pyproject.toml` — add `django-simple-history` dependency; extend `testpaths` and
  coverage `source`.
- `source/majora_project/settings.py` — `INSTALLED_APPS`, `MIDDLEWARE`.
- `source/versioning/` (new) — `__init__.py`, `apps.py`, `admin.py`, `migrations/__init__.py`,
  `tests/`.
- `source/games/models/game.py`, `player.py`, `character.py`, `treasure.py`,
  `character_treasure.py`, `game_photo.py`, `character_photo.py`, `link.py`,
  `character_link.py`, `treasure_photo.py` — add `HistoricalRecords()` field.
- `source/games/migrations/` and/or `source/versioning/migrations/` (new migration(s), per
  Step 4's outcome).
- `docs/agents/architecture.md` — document the new app.

## CI Checks

- `source/`: `cd source && poetry run pytest --cov` and `poetry run ruff check .` (CI job:
  `pytest_all`, `checks`)

## Notes

- The exact mechanism (and its availability in the pinned library version) for placing
  `Historical*` tables under the `versioning` app rather than `games` is unverified as of this
  plan and must be confirmed against the installed `django-simple-history` version during
  implementation (Step 4) — do not assume the kwarg name from general knowledge.
- No new API endpoints or serializers are introduced; history is exposed only via Django Admin
  (Step 6). If future work wants to surface history through the API, that is a separate issue.
- `GameTreasure` is intentionally excluded from tracking per the issue's confirmed scope.
