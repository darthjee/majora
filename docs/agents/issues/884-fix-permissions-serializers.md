# Issue: Fix permissions serializers

## Problem
`CharacterDetailSerializer` (`backend/games/serializers/characters/character_detail.py`) declares 5 permission-derived fields inline (`can_edit`, `can_edit_money`, `can_exchange_treasure`, `can_set_profile_photo`, `can_delete_photo`), each computed from `request.user`. `CharacterFullSerializer` inherits all of them.

### Why is this a problem
Because these fields depend on the requester's identity, every view returning `CharacterDetailSerializer`/`CharacterFullSerializer` payloads must force `X-Skip-Cache: true` (see comments in `games/views/game/_detail.py`, `_full.py`, `_regular.py`, `_money.py`, `_npc_player_update.py`, `npcs/game_npcs.py`, `npcs/game_npcs_full.py`, referencing issue #730). This forces the entire character detail payload (name, links, money, treasure value, etc.) to be uncacheable, purely because of the embedded per-user fields.

Game and Treasure already follow the desired pattern: `game_detail.py` and `treasure_detail.py` carry no permission fields, and their detail endpoints are cacheable through the normal middleware tiers. Only Character has this problem.

The frontend currently reads these 4 fields directly off the character detail/full response (e.g. `CharacterMoneySlot.jsx`, `CharacterEdit.jsx`, `CharacterTreasures.jsx`, `CharacterDetail.jsx`/`CharacterPhotos.jsx`, and the photo-delete mutation gate in `pcConfig.js`/`npcConfig.js`). `CharacterAccessResolver.js`'s `merge()` step, which overlays permissions-endpoint data onto the loaded character, currently only merges `can_edit`, `is_player`, `is_staff`, `access_resolved` — not the 4 fields this issue removes from the backend response. Removing them from the backend alone would silently break these UI features.

## Expected
- `CharacterDetailSerializer` (and therefore `CharacterFullSerializer`) no longer declares any `can_*` permission fields; permissions for a character are obtained exclusively from the existing separate endpoint (`.../permissions.json`, backed by `CharacterPermissionsSerializer`).
- `CharacterPermissionsSerializer` (`backend/games/serializers/characters/character_permissions.py`) is extended to also expose `can_edit_money`, `can_exchange_treasure`, `can_set_profile_photo`, and `can_delete_photo`, alongside its existing `can_edit`, `can_create_item`, `can_upload_item_photo`.
- The `X-Skip-Cache` forcing tied specifically to these embedded permission fields is removed from the character detail/full/npc-create view call sites, so those responses become cacheable like Game/Treasure detail (any `X-Skip-Cache` usage justified by unrelated reasons, e.g. hidden-character 404 gating, is left untouched).
- `CharacterAccessResolver.js`'s `merge()` is extended to also pull `can_edit_money`, `can_exchange_treasure`, `can_set_profile_photo`, and `can_delete_photo` from the permissions-endpoint data (with a fail-closed `false` default), so the frontend features that read these fields off the character object keep working with no behavior change from the user's perspective.

## Benefits
Full separation between entity data and permissions, matching the pattern already used by Game and Treasure. Character detail/full responses become cacheable, reducing load on the backend and Tent proxy for a currently-uncacheable endpoint, with no regression to existing frontend behavior.
