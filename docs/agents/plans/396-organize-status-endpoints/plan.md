# Plan: Organize status endpoints

Issue: [396-organize-status-endpoints.md](../issues/396-organize-status-endpoints.md)

## Overview

Unify the four `access.json` endpoints (game, pc, npc, treasure) so they all return the same
field set — `can_edit`, `username`, `is_superuser`, `is_staff`, `is_dm`, `is_owner` — by
extracting a shared `BaseAccessSerializer` that the four existing serializers extend instead
of each independently duplicating `_user()`/`_is_authenticated()`/`_get_username()`/
`_get_is_superuser()`. This is entirely within `source/games/`, so the plan is not split by
agent.

## Context

- All four views (`games/views/{games/game_access,characters/game_pc_access,
  characters/game_npc_access,treasures/treasure_access}.py`) already share a response
  builder, `access_response()` in `games/views/common.py`, but each serializer
  (`GameAccessSerializer`, `CharacterAccessSerializer`, `PcAccessSerializer`,
  `TreasureAccessSerializer`) reimplements the same helper methods.
- Current field gaps, confirmed by reading each serializer:
  - `TreasureAccessSerializer` only returns `can_edit` — missing `username`, `is_superuser`,
    `is_dm`, `is_owner`, `is_staff` entirely.
  - `is_owner` is only computed by `PcAccessSerializer` (true when
    `character.player.user_id == user.id`); it is absent from the game/npc/treasure
    responses.
  - `is_staff` (Django's built-in `user.is_staff`, already exposed by
    `games/views/auth/status.py`) is not returned by any access endpoint today.
- Existing behavior to preserve: `username`/`is_superuser`/`is_dm` (and, for PC, `is_owner`)
  return `None` when the requester is unauthenticated, `can_edit` always returns a real
  boolean regardless of auth state. This plan keeps that pattern and extends it to the new
  `is_staff` field (same `None`-when-unauthenticated behavior as `is_superuser`).
- Per discussion on the issue, `is_owner` is `False` (not `None`) at every auth state for
  entities with no ownership concept (game, npc, treasure) — it is not an identity field, it's
  "does this ownership relationship exist," which is trivially false when the relationship
  type doesn't exist at all. `PcAccessSerializer` keeps its current, unchanged `is_owner`
  logic (real boolean once authenticated, `None` before).
- `is_dm` needs a "the game this object belongs to" resolution that differs per endpoint: for
  game access it's the instance itself; for pc/npc it's `context['game']`; for treasure it's
  `treasure.game` (or nothing, if the treasure has no game). The shared base captures this via
  a small `_game_for_dm(obj)` hook each subclass overrides.
- `source/games/views/treasures/treasure_access.py` has a comment justifying `AllowAny`
  because "this endpoint returns only a boolean capability flag and no sensitive data" — this
  becomes inaccurate once the endpoint returns `username`/`is_superuser`/etc. (already true of
  the other three endpoints, which expose the same fields to anonymous callers today, so this
  isn't a new exposure — just an existing, now-shared pattern). Update the comment rather than
  the permission class.

## Implementation Steps

### Step 1 — Add `BaseAccessSerializer`

Create `source/games/serializers/base_access.py` with a `BaseAccessSerializer(serializers.Serializer)` carrying:
- The existing `data` property override (supports `instance=None`).
- `_user()`, `_is_authenticated()`.
- `_get_username()`, `_get_is_superuser()`, and a new `_get_is_staff()` (same `None`-when-unauthenticated shape as `_get_is_superuser()`, backed by `user.is_staff`).
- `_get_is_dm(obj)`: `None` when unauthenticated, otherwise `game.game_masters.filter(user=user).exists()` if `self._game_for_dm(obj)` returns a game, else `False`.
- `_game_for_dm(obj)`: default returns `None`; subclasses override to resolve the relevant `Game`.
- `_get_is_owner(obj)`: default returns `False` unconditionally; `PcAccessSerializer` overrides it.
- `_get_can_edit(obj)`: no default implementation (raise `NotImplementedError`) — every subclass must define its own edit rule.
- `to_representation(obj)`: assembles the full 6-field dict by calling the hooks above, so no subclass needs to override it.

### Step 2 — Migrate `GameAccessSerializer`

In `source/games/serializers/game_access.py`, make `GameAccessSerializer` extend `BaseAccessSerializer`, keep its existing `_get_can_edit(game)` (`game.can_be_edited_by(user)`), and add `_game_for_dm(game)` returning `game` itself. Remove the now-duplicated helper methods and `to_representation`/`data` override (inherited from the base).

### Step 3 — Migrate `CharacterAccessSerializer` (npc) and `PcAccessSerializer`

In `source/games/serializers/character_access.py`, make `CharacterAccessSerializer` extend `BaseAccessSerializer`, keep `_get_can_edit(character)` (`character.can_be_edited_by(user)`), and add `_game_for_dm(character)` returning `self.context.get('game')`. Remove the duplicated helpers/`to_representation`/`data`.

In `source/games/serializers/pc_access.py`, keep `PcAccessSerializer(CharacterAccessSerializer)` but replace its `to_representation` override with a `_get_is_owner(character)` override carrying the existing logic (unauthenticated → `None`; else `False` if no `character`/`player`/`player.user_id`, else `character.player.user_id == user.id`) — no other change needed since the base `to_representation` already calls `_get_is_owner`.

### Step 4 — Migrate `TreasureAccessSerializer`

In `source/games/serializers/treasure_access.py`, make `TreasureAccessSerializer` extend `BaseAccessSerializer`, keep its existing `_get_can_edit(treasure)` (own edit rule, falling back to the owning game's edit rule), and add `_game_for_dm(treasure)` returning `treasure.game` when `treasure.game_id` is set, else `None`. Remove the duplicated helpers/`to_representation`/`data`.

### Step 5 — Update the stale `AllowAny` comment

In `source/games/views/treasures/treasure_access.py`, update the comment above `@permission_classes([AllowAny])` to no longer claim the response is "only a boolean capability flag" — describe it consistently with the other three access views (e.g. note that access-check endpoints are intentionally open so the UI can adapt before login, matching game/pc/npc).

### Step 6 — Update tests

- `source/games/tests/views/games/game_access_test.py`: assert the full field set (`is_staff`, `is_owner: False`) alongside the existing `can_edit`/`username`/`is_superuser`/`is_dm` assertions, for both anonymous and authenticated cases.
- `source/games/tests/views/characters/game_character_access_test.py`: extend `_BaseCharacterAccessViewTest` with shared assertions for `is_staff` (mirroring the existing `is_superuser` coverage) and `is_owner` — the base class's `_assert_is_owner` is currently a no-op for NPCs; add an NPC-side assertion that `is_owner` is `False` (not absent) instead of leaving it a no-op, while `TestGamePcAccessView` keeps testing real ownership values.
- `source/games/tests/views/treasures/treasure_access_test.py` and `source/games/tests/serializers/test_treasure_access.py`: add coverage for the newly-present `username`, `is_superuser`, `is_staff`, `is_dm`, `is_owner` (always `False`) fields across the existing anonymous/regular/superuser/DM scenarios already in those files.
- Add a small serializer-level test (or extend an existing one) for `BaseAccessSerializer`'s `_get_is_staff()` using `UserFactory(..., is_staff=True)` (existing pattern, see `source/games/tests/views/staff/staff_user_detail_test.py:22`), covering both staff and non-staff/unauthenticated cases.

## Files to Change

- `source/games/serializers/base_access.py` (new) — shared `BaseAccessSerializer` with the common fields/hooks.
- `source/games/serializers/game_access.py` — extend the base, drop duplicated helpers.
- `source/games/serializers/character_access.py` — extend the base, drop duplicated helpers.
- `source/games/serializers/pc_access.py` — extend `_get_is_owner` instead of overriding `to_representation`.
- `source/games/serializers/treasure_access.py` — extend the base, add the new fields via `_game_for_dm`.
- `source/games/views/treasures/treasure_access.py` — update the stale `AllowAny` comment.
- `source/games/tests/views/games/game_access_test.py` — assert new fields.
- `source/games/tests/views/characters/game_character_access_test.py` — assert new fields, including `is_owner: False` for NPCs.
- `source/games/tests/views/treasures/treasure_access_test.py` — assert new fields.
- `source/games/tests/serializers/test_treasure_access.py` — assert new fields.

## CI Checks

- `source`: `poetry run pytest games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)
- `source`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `source`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`, covers `games/tests/serializers/`)
- `source`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- No frontend changes are in scope: the new fields are additive (existing consumers reading
  `can_edit`/`username`/`is_superuser`/`is_dm` keep working unchanged), and the issue's
  Solution section scopes this to the backend serializers only.
- No product-owner or security review needed: no new endpoint, no permission/authentication
  change, and no new ownership rule — `is_owner` for pc keeps its existing logic verbatim,
  and the other three entities get a hardcoded `False` rather than a new access decision.
- `data-access` review is worth a pass since this does add fields to four existing
  serializers, even though nothing more sensitive than what game/pc/npc already expose to
  anonymous users is being added (the treasure endpoint just catches up to the same shape).
