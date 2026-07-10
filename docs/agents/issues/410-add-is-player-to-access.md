# Issue: Add is_player to access

## Description

The `access.json` endpoints (`GET /games/<slug>/access.json`, `GET /games/<slug>/pcs/<id>/access.json`, `GET /games/<slug>/npcs/<id>/access.json`, and `GET /treasures/<id>/access.json`) share a common response shape (`BaseAccessSerializer`) reporting the requesting user's relationship to the resource: `can_edit`, `username`, `is_superuser`, `is_staff`, `is_dm`, `is_owner`.

We want to add a new `is_player` field to this shared shape, reporting whether the requesting user is a player of the relevant game.

## Expected Behavior

- `is_player` (`bool | null`) is added to the shared access response shape, alongside `is_admin`/`is_superuser`, `is_staff`, `is_dm`, `is_owner`.
- Evaluated (real boolean, `null` only when unauthenticated — mirroring `is_dm`) on the game-scoped access endpoints:
  - `GET /games/<slug>/access.json`
  - `GET /games/<slug>/pcs/<id>/access.json`
  - `GET /games/<slug>/npcs/<id>/access.json`
- Always `false` (never `null`, even when anonymous — mirroring how `is_owner` behaves on resources with no relevant concept) on `GET /treasures/<id>/access.json`, since that route is not nested under `/games/<slug>/`.

## Solution

- `is_player` is evaluated via the `Player.games` M2M relation (`game.players.filter(user=user).exists()`), the same structural pattern `_get_is_dm`/`_game_for_dm` already use for `GameMaster.game.game_masters`.
- `BaseAccessSerializer` gets a new `_get_is_player(obj)` (default: `False`, `null` only when unauthenticated) plus a `_game_for_player(obj)` hook (default: `None`, mirroring `_game_for_dm`), added to `to_representation`.
- `GameAccessSerializer` and `CharacterAccessSerializer` (covering both PC and NPC access) override `_game_for_player` the same way they already override `_game_for_dm`, so `is_player` resolves against the actual game on those three endpoints.
- `TreasureAccessSerializer` does **not** override `_game_for_player`, so `is_player` stays `false` there via the base default — deliberately not mirroring `is_dm`'s treasure-access behavior. Note: `Player.games` is currently never written by any endpoint (only touched in a model test), so `is_player` will read as `false` for every real user until that population flow is built — tracked as a separate, follow-up PR, out of scope here.

## Benefits

- Lets the frontend distinguish "player of this game" from DM/owner/staff/superuser without an extra request, on the three game-scoped access endpoints.
- Follows this repo's convention (`docs/agents/access-control.md`) of updating the access-control reference doc in the same PR — the "Edit access status" tables for Game, Character (PC/NPC), and Treasure each need their `is_player` row added.
