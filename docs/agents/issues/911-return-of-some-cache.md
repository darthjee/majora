# Issue: Return of some cache

## Description
A prior refactor (commit `58529f10`, part of PR #910 fixing issue #907) consolidated the old one-class-per-action `permissions.py` into a new `games/permissions/` package. As part of that cleanup it deleted the entire `backend/games/caches/` package — `CharacterEditorCache`, `GamePlayerCache`, `AdminOrStaffCache`, and their shared `_BooleanCheckCache` base, plus their dedicated tests.

For `CharacterEditorCache` and `GamePlayerCache`, the caching *behavior* was preserved by inlining it directly into `Character.is_editor()` and `Game.has_player()` (calling `majora_project.cache.memory_cache` directly), but the reusable, independently-tested wrapper classes were lost.

For `AdminOrStaffCache`, the removal was a real behavior change, not just a refactor: the admin/staff check it used to wrap (consumed by `require_staff` in `games/views/common.py` and by `_EditPermission._is_admin_or_player`, now folded into `Roles._resolve_admin`/`Roles._resolve_staff` in `games/permissions/roles.py`) is no longer cached anywhere — those call sites just read `request.user.is_staff`/`is_superuser` directly.

This issue is about reintroducing all three cache classes and having their respective call sites use them again, as they did before commit 58529f10.

## Problem
- Caching logic for the PC/NPC editor check and the Game DM/player check now lives inline inside `Character.is_editor()` and `Game.has_player()`, duplicating cache-type/key-building logic directly in the model methods instead of being encapsulated in dedicated, independently-tested classes.
- The admin-or-staff check (`require_staff`, `Roles._resolve_admin`/`_resolve_staff`) is not cached at all today, unlike before commit 58529f10.

## Solution
- Recreate `backend/games/caches/` with `boolean_check_cache.py` (`_BooleanCheckCache` base), `character_editor_cache.py` (`CharacterEditorCache`), `game_player_cache.py` (`GamePlayerCache`), `admin_or_staff_cache.py` (`AdminOrStaffCache`), and `__init__.py` exports, matching their pre-commit-58529f10 implementation.
- Revert `Character.is_editor()` and `Game.has_player()` to delegate to `CharacterEditorCache.is_editor()` / `GamePlayerCache.has_player()` again, instead of calling `memory_cache` inline — confirm this does not break the new `games/permissions/` package, which only calls these methods through their existing public interface.
- Wire `AdminOrStaffCache.is_admin_or_staff()` back into `require_staff` (`games/views/common.py`) and into `Roles._resolve_admin`/`Roles._resolve_staff` (`games/permissions/roles.py`).
- Restore the dedicated test coverage for all three cache classes (`backend/games/tests/caches/character_editor_cache_test.py`, `game_player_cache_test.py`, `admin_or_staff_cache_test.py`).

## Benefits
- Caching logic is decoupled from model and permission classes again, matching the pattern established in issue #704.
- Each cache gets its own dedicated, independently-testable unit instead of being verified only indirectly through model/permission tests.
- Admin-or-staff checks are cached again, consistent with the other permission checks.
