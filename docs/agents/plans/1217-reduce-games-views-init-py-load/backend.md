# Backend Plan: Reduce `games/views/__init__.py` load

Main plan: [plan.md](plan.md)

## Shared contracts

None functionally. Architect's doc update in `docs/agents/views-organization.md`
describes the end state produced here (urls files import view functions directly from
their owning submodules; `games/views/__init__.py` no longer re-exports anything), so
finish this work first — architect's edit should reflect the actual final import shape.

## Implementation Steps

### Step 1 — Replace `from .. import views` with direct imports in the 8 urls files

In each of `backend/games/urls/games.py`, `players.py`, `system.py`, `treasures.py`,
`permissions.py`, `pcs.py`, `npcs.py`, `conversations.py`:

- Drop `from .. import views`.
- For every `views.<name>` reference used in that file's `urlpatterns`, add a named
  import of `<name>` from its actual owning submodule (e.g. `game_detail` lives under
  `games.views.games`, `game_npc_full` under `games.views.game`, etc. — use the current
  `games/views/__init__.py` re-export list, or the submodules' own `__init__.py` files,
  as the authoritative map from name to owning submodule before it's trimmed in Step 2).
  Follow the same mechanical approach already used for #1216's equivalent serializers
  refactor.
- Replace every `views.<name>` call site in that file with the bare `<name>`.
- Keep imports grouped/sorted per the project's existing import-ordering convention
  (check `pyproject.toml`/ruff config, or match the style already used elsewhere in
  `games/urls/`).

This is mechanical and should not change any route path, view behavior, or `urlpatterns`
ordering — only how each view function is imported.

### Step 2 — Reduce `games/views/__init__.py` to a docstring-only module

- Remove every re-export and the `__all__` list from `backend/games/views/__init__.py`.
- Replace the file's content with a docstring describing the subpackage layout (mirror
  the approach taken for `backend/games/serializers/__init__.py` in #1216), so the file
  still serves as a navigation aid without eagerly importing anything.
- Confirm no other file still does `from games.views import <name>` or
  `from .. import views` anywhere in `backend/` after Step 1 (the 19 files already
  importing from `games/views/common.py` directly are unaffected and need no changes).

## Files to Change

- `backend/games/urls/games.py` — replace `from .. import views` + attribute access with
  direct named imports (~90 names).
- `backend/games/urls/players.py` — same replacement.
- `backend/games/urls/system.py` — same replacement.
- `backend/games/urls/treasures.py` — same replacement.
- `backend/games/urls/permissions.py` — same replacement.
- `backend/games/urls/pcs.py` — same replacement.
- `backend/games/urls/npcs.py` — same replacement.
- `backend/games/urls/conversations.py` — same replacement.
- `backend/games/views/__init__.py` — strip all re-exports/`__all__` down to a
  docstring-only module.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `backend`: `poetry run pytest` (full suite, CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- No behavior/route change — this is a pure import-path refactor. If any test currently
  mocks/patches through `games.views.<name>` (the aggregator) rather than the owning
  submodule, it must be updated to patch the new import location instead (a grep across
  `games/tests/` at discussion time found no such usage, so none are expected, but
  double-check after Step 1).
- `urls/permissions.py` imports `views` alongside other imports (see its existing import
  block) — preserve whatever else it already imports unrelated to this refactor.
