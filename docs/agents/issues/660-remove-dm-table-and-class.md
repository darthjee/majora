# Issue: Remove GameMaster table and class

## Description
The Dungeon Master (DM) role for a game can now be fully tracked through `Player.is_dm` (added in #659). The separate `GameMaster` model — a join table linking a `Game` to a `User` for the DM role — is now redundant and should be removed, along with all code that reads or writes it.

## Problem
`GameMaster` and `Player.is_dm` are two parallel, independently-maintained sources of truth for "is this user the DM of this game":
- `GameMaster.objects.create(...)` and `Player(is_dm=True)` are both created together when a game is created (`games_list.py`).
- The actual DM permission check in `base_access.py`'s `_get_is_dm` still derives DM status from the `GameMaster` FK relation (`game.game_masters.filter(user=user).exists()`), not from `Player.is_dm`.
- Dedicated API endpoints exist for managing `GameMaster` rows directly: `GET/POST games/<slug>/game-masters.json` and `DELETE games/<slug>/game-masters/<id>.json`.
- Note: no class literally named `DungeonMaster` exists in the codebase — the model that plays this role is named `GameMaster`.

## Solution
- Replace every read of the `GameMaster` relation (in particular `base_access.py`'s `_get_is_dm`) with a lookup against `Player.is_dm`.
- Remove the `GameMaster.objects.create(...)` call in `games_list.py` (the `Player(is_dm=True)` creation already covers it).
- Remove the `GameMaster` model, its serializer, its admin registration, and its dedicated views/URLs (`game_masters_list`, `game_master_detail`, and the `games/<slug>/game-masters(.json|/<id>.json)` routes) entirely — they're unused by the frontend today and have no reason to survive without a backing table.
- Add a migration dropping the `GameMaster` table (and its historical-records counterpart, if any).
- Update/remove tests and factories (`GameMasterFactory`) that reference `GameMaster`, switching test setup to `Player(is_dm=True)` instead.
- No extra data-reconciliation migration needed: `Player.is_dm` was already backfilled in #659 and both records have been created together at game-creation time ever since, so no drift is expected.

## Benefits
- A single source of truth for DM status (`Player.is_dm`), removing the risk of the two records drifting out of sync.
- Simpler model graph and fewer endpoints to maintain.
