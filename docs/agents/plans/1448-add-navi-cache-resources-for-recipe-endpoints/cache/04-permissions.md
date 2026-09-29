# Game recipe permissions
Add `permissions_game_recipe` to `navi/resources/permissions.yml`, with the same five URLs as
`permissions_game_document`: `/permissions/game_recipe.json` plus the `?role=player&role=logged`,
`?role=dm&role=player&role=logged`, `?role=staff&role=player&role=logged` and
`?role=staff&role=dm&role=player&role=logged` variants, each `status: 200`.

The `can_create_recipe` flag on `/permissions/game.json` and `can_exchange_recipe` on
`/permissions/game_pc.json` / `game_npc.json` are already covered by the existing resources.

## Files to Change
- `navi/resources/permissions.yml` — new `permissions_game_recipe` resource.
