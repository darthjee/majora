# Plan: Return of some cache

Issue: [911-return-of-some-cache.md](../../issues/911-return-of-some-cache.md)

## Overview

Recreate the `backend/games/caches/` package (`_BooleanCheckCache`, `CharacterEditorCache`,
`GamePlayerCache`, `AdminOrStaffCache`) that commit `58529f10` (PR #910, issue #907) deleted
while inlining its logic, and route the relevant call sites back through these classes. Restore
their dedicated test coverage under `backend/games/tests/caches/`.

## Context

Commit `58529f10` retired `backend/games/caches/` when it introduced `games/permissions/`. For
`CharacterEditorCache`/`GamePlayerCache` it inlined the exact same caching logic directly into
`Character.is_editor()`/`Game.has_player()` (still calling the shared `majora_project.cache
.memory_cache`), so behavior was preserved but the reusable, independently-tested wrapper was
lost. For `AdminOrStaffCache` it was a real behavior change: the admin/staff check is no longer
cached anywhere — `require_staff()` and `Roles._resolve_admin`/`_resolve_staff` now read
`request.user.is_staff`/`is_superuser` directly, uncached.

## Implementation Steps

### Step 1 — Recreate `backend/games/caches/`

Restore, matching their pre-`58529f10` implementation (`git show 58529f10~1:backend/games/caches/<file>`
is the exact prior source — safe to restore verbatim):

- `backend/games/caches/__init__.py` — exports `AdminOrStaffCache`, `GamePlayerCache`,
  `CharacterEditorCache`.
- `backend/games/caches/boolean_check_cache.py` — `_BooleanCheckCache` base class wrapping
  `majora_project.cache.memory_cache` get/set for a boolean result.
- `backend/games/caches/character_editor_cache.py` — `CharacterEditorCache.is_editor(character, user)`.
- `backend/games/caches/game_player_cache.py` — `GamePlayerCache.has_player(game, user, is_dm=None)`.
- `backend/games/caches/admin_or_staff_cache.py` — `AdminOrStaffCache.is_admin_or_staff(user)`.

### Step 2 — Revert `Character.is_editor()` and `Game.has_player()` to delegate

In `backend/games/models/character/character.py`, replace the inlined `memory_cache` calls in
`is_editor()` with `CharacterEditorCache.is_editor(self, user)`; drop the now-unused
`_PC_EDITOR_ENTRY_TYPE`/`_NPC_EDITOR_ENTRY_TYPE` constants, the `sys` import, and the direct
`majora_project.cache` import, replacing them with `from games.caches import CharacterEditorCache`.

In `backend/games/models/game/game.py`, replace the inlined `memory_cache` calls in
`has_player()` with `GamePlayerCache.has_player(self, user, is_dm)`; drop `_PLAYER_ENTRY_TYPE`,
the `sys` import, the direct `majora_project.cache` import, and the now-redundant
`_query_has_player` helper (its query logic moves into `GamePlayerCache._query`, matching the
pre-refactor split), replacing the import with `from games.caches import GamePlayerCache`.

This is a pure internal-implementation swap: both methods keep their existing public signature
and return type, and every caller in `games/permissions/` (`Roles._resolve_dm`,
`_resolve_player`, `EndpointPermission`, etc.) only ever calls `game.has_player(...)` /
`character.is_editor(...)` through that public interface — never the old cache classes or the
inlined `memory_cache` calls directly — so this revert is safe and does not touch
`games/permissions/`.

### Step 3 — Wire `AdminOrStaffCache` into `require_staff` only

In `backend/games/views/common.py`, change `require_staff()`'s
`if not (request.user.is_staff or request.user.is_superuser):` check to
`if not AdminOrStaffCache.is_admin_or_staff(request.user):`, importing it from `games.caches`.
This is a direct, semantics-preserving fit: `require_staff` already treats "staff" and
"superuser" as one combined condition, exactly what `AdminOrStaffCache.is_admin_or_staff()`
caches.

**Do not** wire `AdminOrStaffCache` into `Roles._resolve_admin`/`Roles._resolve_staff`
(`backend/games/permissions/roles.py`) — see Notes for why this would be incorrect despite the
issue text asking for it.

### Step 4 — Restore dedicated cache tests

Recreate `backend/games/tests/caches/__init__.py`,
`admin_or_staff_cache_test.py`, `character_editor_cache_test.py`, and
`game_player_cache_test.py` (pre-`58529f10` source via
`git show 58529f10~1:backend/games/tests/caches/<file>`), adjusting only for any unrelated API
drift since then (e.g. factory signatures) if tests fail to collect/run as-is.

## Files to Change

- `backend/games/caches/__init__.py` — recreate, cache package exports
- `backend/games/caches/boolean_check_cache.py` — recreate, shared base class
- `backend/games/caches/character_editor_cache.py` — recreate
- `backend/games/caches/game_player_cache.py` — recreate
- `backend/games/caches/admin_or_staff_cache.py` — recreate
- `backend/games/models/character/character.py` — `is_editor()` delegates to `CharacterEditorCache` again
- `backend/games/models/game/game.py` — `has_player()` delegates to `GamePlayerCache` again
- `backend/games/views/common.py` — `require_staff()` delegates to `AdminOrStaffCache`
- `backend/games/tests/caches/__init__.py` — recreate
- `backend/games/tests/caches/admin_or_staff_cache_test.py` — recreate
- `backend/games/tests/caches/character_editor_cache_test.py` — recreate
- `backend/games/tests/caches/game_player_cache_test.py` — recreate

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` (backend lint; matches `[tool.ruff]` config in `backend/pyproject.toml`, no dedicated CircleCI job found but should still pass)

## Notes

- **Deviation from the issue's literal wording**: the issue also asks to wire `AdminOrStaffCache`
  into `Roles._resolve_admin`/`Roles._resolve_staff`. Doing so would be wrong: the old
  `AdminOrStaffCache.is_admin_or_staff()` returns one *combined* `is_staff or is_superuser`
  boolean, but `Roles` treats `admin` and `staff` as two independent roles (`ROLE_NAMES =
  ('admin', ..., 'staff', ...)`) — reusing the combined check for `_resolve_admin()` would make a
  staff-only (non-superuser) user register as `admin`, and vice versa for `_resolve_staff()`.
  This is exactly the kind of permission-model breakage the user asked to avoid when reverting.
  `AdminOrStaffCache` is restored and used only where its combined semantics already match
  (`require_staff`); `Roles._resolve_admin`/`_resolve_staff` are left as direct attribute reads.
- Also worth noting for whoever reviews this: `is_staff`/`is_superuser` are plain attribute reads
  on the already-loaded `request.user` object, not DB queries — so caching them (as
  `AdminOrStaffCache` does) saves no query, only a `getattr` plus an `or`. The original design
  cached it anyway for consistency with the other two boolean checks; this plan preserves that
  choice rather than second-guessing it, since the issue explicitly asked for it.
- `docs/agents/access-control/staff-cache.md` currently documents a 3rd cache type
  ("admin-or-staff") among the ones cleared by `DELETE /staff/cache.json`. Restoring
  `AdminOrStaffCache` makes that doc accurate again for the admin-or-staff type; no further doc
  change should be needed there as part of this issue.
