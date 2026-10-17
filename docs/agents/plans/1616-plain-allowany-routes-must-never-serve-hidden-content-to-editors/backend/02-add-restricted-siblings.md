# Add the missing restricted siblings

Add the two routes from plan.md's "New restricted routes" table.

**`GET /games/<slug>/npcs/<id>/photos/all.json`** — NPC-only. Register it through
`build_character_urlpatterns`'s `extra_routes` in `backend/games/urls/npcs.py`, like
`/treasures/all.json`. Model the view on `game_npc_treasures_all.py`: check the permission
first, then resolve the NPC with the editor-aware gate (or no gate), and serve the ready photos
even when the NPC is hidden. Use CharacterEdit (`character.can_be_edited_by`). Set
`X-Skip-Cache: true`.

**`GET /games/<slug>/treasures/<treasure_id>/full.json`** — GameEdit
(`check_game_edit`/`EndpointPermission`, following `game_treasures_all`). Check the permission
before resolving the treasure. Return `TreasureDetailSerializer` data plus `hidden` (from the
`GameTreasure` row, `false` when there is none). Set `X-Skip-Cache: true`. Add any
`endpoints.yml` permission config the existing restricted routes use.

Follow `docs/agents/views-organization.md` for file placement, and export the views where the
URL modules expect them (`game_npc_photos_all` from `games.views.game`).

## Files to Change
- `backend/games/urls/npcs.py` — add the `('/photos/all.json', 'photos_all')` extra route
- `backend/games/urls/games.py` — add `games/<slug>/treasures/<int:treasure_id>/full.json`
- `backend/games/views/game/npcs/detail/photos/game_npc_photos_all.py` (new) and the package `__init__` exports
- `backend/games/views/games/game_treasure_full.py` (new, or alongside `game_treasure_detail.py`) and exports
- `backend/games/serializers/...` — add `hidden` to the treasure detail response for the full route only, if a serializer change is needed
- `backend/games/permissions/config/...` — permission config for the new routes, if the pattern requires one
