# Issue: Reduce `games/views/__init__.py` load

## Description

Sibling issue to #1216 ("Reduce `__init__.py` load"), split off after auditing the two
files: `games/serializers/__init__.py` and `games/views/__init__.py` have very different
consumer profiles and migration costs, so they are being resolved independently rather
than under one issue.

## Problem

`backend/games/views/__init__.py` (463 lines) imports every view function from every
views submodule and re-exports ~200+ names via a giant `__all__`, exactly like the
serializers package did — but the *usage pattern* is different:

- **0 files** anywhere import it the conventional way (`from games.views import X`).
- **8 files** — all of `backend/games/urls/*.py` (`games.py`, `players.py`, `system.py`,
  `treasures.py`, `permissions.py`, `pcs.py`, `npcs.py`, `conversations.py`) — consume it
  via `from .. import views` plus attribute access (`views.game_detail`, etc.). Together
  they reference ~102 distinct view-function names this way; `urls/games.py` alone
  touches ~90.
- **19 other files** (in `uploads/`, `accounts/views/auth/`, `staff/views/*`,
  `miniatures/views/*`) import directly from `games/views/common.py` (helper functions
  only) — they already bypass the aggregator entirely.

So unlike serializers (182 external consumers of the package-level re-export,
documented as a stable public API), the views `__init__.py`'s only real job is giving
`games/urls/*.py` a flat `views.<name>` namespace. That's a narrow, mechanical blast
radius: 8 files, each needing its `from .. import views` + attribute-access calls
replaced with explicit named imports from the actual view submodules.

## Expected Behavior

`games/views/__init__.py` should no longer eagerly import and re-export every view
function. `backend/games/urls/*.py` should import each view function it needs directly
from its owning submodule instead of going through the package-level `views` namespace.

## Solution

- Replace each of the 8 `games/urls/*.py` files' `from .. import views` + `views.<name>`
  attribute-access calls with direct named imports from the specific view submodules.
- Reduce `games/views/__init__.py` to a lightweight, docstring-only module describing the
  subpackage layout (mirroring the approach taken for serializers in #1216) — no
  top-level re-exports.
- Update `docs/agents/views-organization.md`'s note ("Every affected import (`urls.py`,
  package `__init__.py` re-exports) must be updated...") to reflect that `urls.py` files
  now import directly from view submodules rather than through the package `__init__.py`.
- No behavior/route change — this is a pure import-path refactor.

## Benefits

- Removes eager loading of ~200+ view functions (and everything they transitively import
  — serializers, models, permissions) on every `games.views` import.
- `games/views/__init__.py` becomes an actual navigation aid instead of a flat import
  dump.
- Small, mechanical blast radius (8 files) makes this safe to land independently of the
  serializers work in #1216.
