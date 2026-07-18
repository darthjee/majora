# Plan: Remove GameMaster table and class

Issue: [660-remove-dm-table-and-class.md](../issues/660-remove-dm-table-and-class.md)

## Overview

Remove the standalone `GameMaster` model/table entirely and make `Player.is_dm` the
single source of truth for DM status. This means rewiring the one real permission check
that still reads the `GameMaster` relation, deleting the model/serializer/admin/views/URLs
built on it, dropping the table via migration, converting ~63 test files off
`GameMasterFactory` onto `PlayerFactory(is_dm=True)`, and updating the product/access-control
docs that currently define DM status in terms of a `GameMaster` row.

## Context

Issue #659 already added `Player.is_dm` and backfilled it from existing `GameMaster` rows,
and `games_list.py` has created both a `GameMaster` row and a `Player(is_dm=True)` row
together at game-creation time ever since. The two are now redundant. The actual DM
permission check (`BaseAccessSerializer._get_is_dm` in `base_access.py`) still derives DM
status from `game.game_masters.filter(user=user).exists()` — the `GameMaster` FK relation —
not from `Player.is_dm`, so that is the one behavior-affecting change here; everything else
is deletion/cleanup.

There are also dedicated, currently frontend-unused API endpoints
(`GET/POST games/<slug>/game-masters.json`, `DELETE games/<slug>/game-masters/<id>.json`)
that let any authenticated user self-assign as a game's DM, list DMs, or step down. These are
the only way to change DM status on a game *after* creation. Per explicit user decision, this
issue removes them with no replacement — accepting that gap (self-service DM promotion may
return as a `Player.is_dm`-based endpoint in a future issue, if ever needed).

No `HistoricalGameMaster` table exists — `GameMaster` was never added to the
`versioning` app's tracked models — so no historical-records migration is needed.

## Implementation Steps

### Step 1 — Switch the DM permission check to `Player.is_dm`

In `backend/games/serializers/base_access.py`, change `_get_is_dm` to mirror the existing
`_get_is_player` pattern:

```python
def _get_is_dm(self, obj):
    if not self._is_authenticated():
        return None
    game = self._game_for_dm(obj)
    user = self._user()
    return game.players.filter(user=user, is_dm=True).exists() if game else False
```

This is the one change in this issue with runtime behavioral impact — verify carefully via
the existing `is_dm` assertions in access-serializer tests (e.g. `base_access_test.py`,
`treasure_access_test.py`) after switching test setup (Step 5) off `GameMasterFactory`.

### Step 2 — Stop creating `GameMaster` rows

In `backend/games/views/games/games_list.py`, remove the
`GameMaster.objects.create(game=game, user=request.user)` line and the now-unused
`GameMaster` import — the `Player.objects.get_or_create(..., defaults={'is_dm': True, ...})`
call right below it already covers marking the creator as DM.

### Step 3 — Remove the `GameMaster` model, serializer, admin, views, and URLs

Delete entirely:
- `backend/games/models/game/game_master.py`
- `backend/games/serializers/games/game_master.py`
- `backend/games/views/game_masters/` (both `game_masters_list.py` and `game_master_detail.py`, plus the folder's `__init__.py`)

Remove references in:
- `backend/games/models/__init__.py` — drop the `GameMaster` import and its `__all__` entry.
- `backend/games/serializers/__init__.py` — drop the `GameMasterSerializer` import and its `__all__` entry.
- `backend/games/views/__init__.py` — drop the `from .game_masters import ...` line and the two `__all__` entries.
- `backend/games/admin.py` — drop the `GameMaster` import and `admin.site.register(GameMaster)`.
- `backend/games/urls/games.py` — remove the `game-masters.json` and `game-masters/<int:game_master_id>.json` `path(...)` entries (`game-masters-list`, `game-master-detail`).

### Step 4 — Drop the `GameMaster` table

Add a new migration (next number after `0067_...`) that runs `migrations.DeleteModel('GameMaster')`. No data migration is needed beforehand (see Context) — just the schema drop. Django's migration autodetector should produce this cleanly once Step 3's model deletion is in place; run `makemigrations` inside the backend container per project convention and review the generated file before committing.

### Step 5 — Convert tests off `GameMasterFactory`

- Delete the tests that exist solely to cover the removed code:
  - `backend/games/tests/models/game/game_master_test.py`
  - `backend/games/tests/serializers/games/game_master_test.py`
  - `backend/games/tests/views/game_masters/game_master_detail_test.py`
  - `backend/games/tests/views/game_masters/game_masters_list_test.py`
- In `backend/games/tests/factories.py`, remove `GameMasterFactory` and the `GameMaster` import.
- In `backend/games/tests/views/games/games_list_test.py`, remove the `GameMaster`-based
  assertions (`GameMaster.objects.filter(...).exists()` / `.count()`) — the equivalent
  `Player(is_dm=True)` assertions already exist alongside them per the earlier explore findings; drop the `GameMaster` import too.
- Across the remaining ~59 test files that use `GameMasterFactory(game=..., user=...)`
  purely as fixture setup (list surfaced during planning; re-grep `GameMasterFactory` to get
  the current exact set before starting, since it's a wide, mechanical sweep), replace each
  call with `PlayerFactory(game=..., user=..., is_dm=True)` and drop the now-unused
  `GameMasterFactory` import from each file's import list.
- `backend/versioning/tests/historical_records_test.py` also uses `GameMasterFactory` —
  same mechanical replacement applies there.

### Step 6 — Update product/access-control documentation

Per the product-owner review, these docs currently define DM status in terms of the
`GameMaster` row and must be updated in the same PR:

- `docs/agents/product.md` — rewrite the "GameMaster Role" section and "Editing Rules" rule 3
  to derive DM status from `Player.is_dm` instead of a `GameMaster` row; update the "User"
  and "Staff Role" sections' mentions of `GameMaster` as a model/joinable resource.
- `docs/agents/access-control/common-rules.md` — update the `Game.can_be_edited_by` /
  `Character.can_be_edited_by` derivations and the `is_dm` field description to reference
  `Player.is_dm`.
- `docs/agents/access-control/user-roles.md` — redefine the "GameMaster" role row in terms of
  `Player.is_dm` rather than a `GameMaster` row.
- `docs/agents/access-control/game-master.md` — delete (documents the removed endpoints), and
  remove its link from `docs/agents/access-control.md`'s index.
- `docs/agents/models-organization.md` and `docs/agents/views-organization.md` — drop the
  now-removed `GameMaster` model file path and `game_masters/` view-folder references.

## Files to Change

- `backend/games/serializers/base_access.py` — `_get_is_dm` reads `Player.is_dm` instead of the `GameMaster` relation
- `backend/games/views/games/games_list.py` — stop creating a `GameMaster` row
- `backend/games/models/game/game_master.py` — delete
- `backend/games/serializers/games/game_master.py` — delete
- `backend/games/views/game_masters/` — delete (folder)
- `backend/games/models/__init__.py` — drop `GameMaster` export
- `backend/games/serializers/__init__.py` — drop `GameMasterSerializer` export
- `backend/games/views/__init__.py` — drop `game_masters_list`/`game_master_detail` exports
- `backend/games/admin.py` — drop `GameMaster` admin registration
- `backend/games/urls/games.py` — drop the two `game-masters` routes
- `backend/games/migrations/00XX_delete_gamemaster.py` — new migration dropping the table
- `backend/games/tests/factories.py` — drop `GameMasterFactory`
- `backend/games/tests/models/game/game_master_test.py` — delete
- `backend/games/tests/serializers/games/game_master_test.py` — delete
- `backend/games/tests/views/game_masters/game_master_detail_test.py` — delete
- `backend/games/tests/views/game_masters/game_masters_list_test.py` — delete
- `backend/games/tests/views/games/games_list_test.py` — drop `GameMaster`-based assertions
- ~59 other files under `backend/games/tests/**` and `backend/versioning/tests/historical_records_test.py` — swap `GameMasterFactory(...)` for `PlayerFactory(..., is_dm=True)`
- `docs/agents/product.md`, `docs/agents/access-control.md`, `docs/agents/access-control/common-rules.md`, `docs/agents/access-control/user-roles.md`, `docs/agents/access-control/game-master.md` (delete), `docs/agents/models-organization.md`, `docs/agents/views-organization.md` — documentation updates per Step 6

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

Run these via `make tests` (opens a shell in the `_tests` container) per project convention, rather than invoking `poetry`/`pytest` on the host.

## Notes

- Self-service DM promotion/demotion (the `game-masters` POST/DELETE endpoints) is removed
  with no replacement, per explicit user decision during discussion — flagged here so it
  isn't mistaken for an oversight. A future issue can reintroduce equivalent capability on
  top of `Player.is_dm` if a real need arises.
- The `GameMasterFactory` → `PlayerFactory(is_dm=True)` test conversion is wide (~63 files)
  but mechanical; re-grep for `GameMasterFactory` at implementation time to get the exact,
  current file list rather than relying on the count captured during planning.
- Double-check for any other `GameMaster`-only fixtures/helpers in `tests/views/common_test.py`
  or similar shared test-setup files, since several files in the grep results were shared
  test-support modules rather than one-off test cases.
