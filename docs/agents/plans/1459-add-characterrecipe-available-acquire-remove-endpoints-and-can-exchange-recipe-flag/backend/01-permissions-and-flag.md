# Permission configs and can_exchange_recipe flag

Add the per-resource permission configs for character recipes and expose the
`can_exchange_recipe` flag on the character permissions endpoints.

- `endpoints.yml` for `game_pc_recipe` and `game_npc_recipe`: `regular.create: [staff, player]`
  only, with a header comment in the style of `game_pc_possession/endpoints.yml` (issue #1459,
  gates `available` / `acquire` / `remove`). No `restricted` block: the `/all` variants use
  GameEdit / CharacterEdit.
- `ui.yml` for both resources: `exchange: [staff, player]`, with a comment saying it must mirror
  `endpoints.yml`'s `regular.create`.
- `permissions/config/pages/character_pc.yml` gets `game_pc_recipe: { exchange: can_exchange_recipe }`,
  and `character_npc.yml` gets the `game_npc_recipe` equivalent. This follows
  `game_pc_possession: { create_update: can_create_possession }`.
- Add `_character_recipe_resource(character)` to `games/views/game/_character/_shared.py`, next to
  `_character_document_resource`, returning `'game_pc_recipe'` / `'game_npc_recipe'`.

## Files to Change
- `backend/permissions/config/game_pc_recipe/endpoints.yml` — new
- `backend/permissions/config/game_pc_recipe/ui.yml` — new
- `backend/permissions/config/game_npc_recipe/endpoints.yml` — new
- `backend/permissions/config/game_npc_recipe/ui.yml` — new
- `backend/permissions/config/pages/character_pc.yml` — add `game_pc_recipe.exchange`
- `backend/permissions/config/pages/character_npc.yml` — add `game_npc_recipe.exchange`
- `backend/games/views/game/_character/_shared.py` — add `_character_recipe_resource`
