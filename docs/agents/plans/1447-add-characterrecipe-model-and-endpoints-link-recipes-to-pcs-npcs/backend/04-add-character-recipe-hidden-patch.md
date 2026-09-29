# Add the hidden-only PATCH

Allow `PATCH` on `.../recipes/<character_recipe_id>.json`. Model the branching on
`build_item_detail_view` in `views/game/_character/items/_item_shared.py`, where the factory
accepts `['GET', 'PATCH']`.

Checks run in this order:

1. **NPC only:** the hidden-NPC gate (`_hidden_gate_response`). A hidden NPC that the caller
   cannot view returns `404`.
2. **Authorization:** `_check_character_all_permission` (CharacterEdit on PCs, GameEdit on NPCs)
   returns `401` if unauthenticated and `403` if unauthorized.
3. **Row lookup:** look up the row among the character's own rows, **including hidden ones**.
   An unknown or other-character id returns `404`.
4. **Update:** only `hidden` (boolean) is written. Every other field is ignored.

The response uses the `/full.json` shape (with `hidden`) and the same caller-dependent output
masking as step 03. It sets `X-Skip-Cache: true`.

Tests (PC and NPC):

- The order of checks: a non-editor gets 403, never 404, for an unknown id.
- Unhiding works and ignores `GameRecipe.hidden`.
- The PC owner can unhide.
- Other fields are ignored.
- Other-character ids return `404`.
- NPC gate behaviour.
- History is recorded.

## Files to Change

- `backend/games/views/game/_character/recipes/_recipe_shared.py`: PATCH branch in
  `build_recipe_detail_view`.
- `backend/games/views/game/recipes/_character_recipes.py`: `character_recipe_update` helper.
- `backend/games/tests/views/game/pcs|npcs/detail/recipes/detail/*_patch_test.py`: tests.
