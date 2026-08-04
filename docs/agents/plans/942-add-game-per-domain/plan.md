# Plan: Add game per Domain

Issue: [942-add-game-per-domain.md](../../issues/942-add-game-per-domain.md)

## Overview

Add two new foundational models to the `games` app — `GameDomainGroup`
(tenant/brand) and `GameDomain` (a hostname belonging to a group) — plus a
new optional `Game.game_domain_group` foreign key. This is a models-only
change: no serializers, views, or API endpoints. It lays the data-model
groundwork for future multi-tenant/white-labeled game serving.

## Context

`GameDomainGroup` is the hub: many `GameDomain`s (hostnames) can point at
the same group, and many `Game`s can belong to the same group, so several
hostnames can serve the same set of games. `Game.game_domain_group` starts
optional and is expected to become mandatory later, once existing data is
migrated — that migration is explicitly out of scope for this issue.

## Implementation Steps

### Step 1 — Add `GameDomainGroup` model

Create `backend/games/models/game/game_domain_group.py`:
- `name` (`CharField`, e.g. `max_length=200` to match `Game.name`).
- `history = HistoricalRecords(app='versioning', user_db_constraint=False)`,
  matching the pattern in `backend/games/models/game/game.py`.
- `__str__` returning `self.name`, matching the convention used by `Game`
  and other core models.

### Step 2 — Add `GameDomain` model

Create `backend/games/models/game/game_domain.py`:
- `domain` (`CharField`, globally unique, e.g. `max_length=200`) — the full
  hostname (e.g. `foo.majora.app`).
- `game_domain_group` (`ForeignKey` to `GameDomainGroup`, required,
  `on_delete=models.CASCADE`, `related_name='domains'`).
- `history = HistoricalRecords(app='versioning', user_db_constraint=False)`.
- `__str__` returning `self.domain`.

### Step 3 — Add `Game.game_domain_group` field

In `backend/games/models/game/game.py`, add:
- `game_domain_group` (`ForeignKey` to `'games.GameDomainGroup'`,
  `null=True`, `blank=True`, `on_delete=models.SET_NULL`,
  `related_name='games'`).

### Step 4 — Wire up the models package

In `backend/games/models/__init__.py`, import and export `GameDomainGroup`
and `GameDomain` (alphabetically ordered among the existing `Game*` imports
and `__all__` entries), following the existing pattern for every other model
in the `games/models/game/` folder.

### Step 5 — Register in Django admin

In `backend/games/admin.py`, import and register both `GameDomainGroup` and
`GameDomain` via `admin.site.register(...)`, matching the plain
(non-customized) registration style already used for models like `Player`,
`CharacterLink`, etc. (no special `ModelAdmin`/inlines needed, unlike
`GameAdmin`).

### Step 6 — Generate migrations

Run `poetry run python manage.py makemigrations games versioning` from
`backend/` to generate:
- A `games` migration creating `GameDomainGroup`, `GameDomain`, and the new
  `Game.game_domain_group` field.
- A `versioning` migration creating the corresponding
  `HistoricalGameDomainGroup` and `HistoricalGameDomain` tables, matching how
  existing `Historical*` models are generated for `Game`/`Character`/etc.

### Step 7 — Tests

Add model tests under `backend/games/tests/models/game/`, following the
structure of `game_test.py`:
- `game_domain_group_test.py` — covers `__str__`, and that a
  `GameDomainGroup` can be created/saved with just a `name`.
- `game_domain_test.py` — covers `__str__`, the required
  `game_domain_group` FK, `on_delete=CASCADE` (deleting the group deletes
  the domain), and the `domain` uniqueness constraint.
- Extend `game_test.py` (or add a small addition) to cover that
  `Game.game_domain_group` is optional (a `Game` saves fine with it unset),
  and that deleting a `GameDomainGroup` sets `game.game_domain_group` to
  `None` rather than deleting the `Game` (`on_delete=SET_NULL`).

## Files to Change

- `backend/games/models/game/game_domain_group.py` — new `GameDomainGroup` model.
- `backend/games/models/game/game_domain.py` — new `GameDomain` model.
- `backend/games/models/game/game.py` — add optional `game_domain_group` FK.
- `backend/games/models/__init__.py` — import/export the two new models.
- `backend/games/admin.py` — register the two new models.
- `backend/games/migrations/00XX_*.py` — new migration (generated).
- `backend/versioning/migrations/00XX_*.py` — new migration (generated).
- `backend/games/tests/models/game/game_domain_group_test.py` — new tests.
- `backend/games/tests/models/game/game_domain_test.py` — new tests.
- `backend/games/tests/models/game/game_test.py` — extended tests for the new FK.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job covering non-view backend tests, which includes `games/tests/models/`).

## Notes

- No serializers, views, API endpoints, or permission logic are part of this
  issue — purely models, admin, and migrations.
- The migration making `Game.game_domain_group` mandatory (once existing
  data is backfilled) is explicitly deferred to a future issue.
