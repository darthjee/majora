# Issue: Organize status endpoints

## Description
There are four `access.json` endpoints that report a user's permission level for a given resource, each returning a slightly different, independently-implemented set of fields:

- `GET /games/:game_slug/access.json` — `GameAccessSerializer`
- `GET /games/:game_slug/pcs/:id/access.json` — `PcAccessSerializer` (subclasses `CharacterAccessSerializer`)
- `GET /games/:game_slug/npcs/:id/access.json` — `CharacterAccessSerializer`
- `GET /games/:game_slug/treasures/:id/access.json` — `TreasureAccessSerializer` (not mentioned in the original report; only returns `can_edit` today)

All four already share a common response builder, `access_response()` in `source/games/views/common.py`, but the serializers themselves duplicate near-identical logic (`_user()`, `_is_authenticated()`, `_get_username()`, `_get_is_superuser()`) instead of sharing a base class.

## Problem
Fields returned differ per endpoint:

- Common to game/pc/npc: `can_edit`, `username`, `is_superuser`, `is_dm`
- `is_owner`: only returned by the pc endpoint (true when `character.player.user_id == user.id`); absent elsewhere
- The treasure endpoint only returns `can_edit`, missing all other fields
- `is_staff` (Django's built-in `user.is_staff`, already used elsewhere e.g. `games/views/auth/status.py`) is not returned by any of them

This inconsistency makes the frontend handle each access response differently and forces defensive checks for fields that may or may not be present.

## Solution
Unify all four access endpoints (game, pc, npc, treasure) to return the same set of fields: `can_edit`, `username`, `is_superuser`, `is_dm`, `is_owner`, `is_staff`.

- Endpoints/entities with no real "owner" concept (game, npc, treasure) return `is_owner: false` rather than omitting the field.
- `is_dm` for the treasure endpoint follows the same rule as the other endpoints when the treasure belongs to a game; when it doesn't (no `game_id`), it returns `false`.
- `is_staff` reflects Django's built-in `user.is_staff`.
- Introduce a shared base serializer to eliminate the duplicated `_user()`/`_is_authenticated()`/`_get_username()`/`_get_is_superuser()` logic across the four serializers, following the existing `PcAccessSerializer`→`CharacterAccessSerializer` subclassing pattern.

## Benefits
- Frontend can rely on a single consistent access-response shape across all resource types, simplifying access-dependent UI logic.
- Less duplicated serializer code, easier to maintain and extend to future resource types.
- Adding `is_staff` allows staff-specific UI differentiation.
