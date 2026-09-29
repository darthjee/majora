# Tests

Mirror the document exchange tests under
`games/tests/views/game/{pcs,npcs}/detail/recipes/` (and `detail/`), one `_test.py` per view
module, plus the permission-flag tests.

Cover, for PC and NPC:

- **available:**
  - Anonymous and non-member callers get 401/403.
  - Player and staff get `200`.
  - The list excludes hidden `GameRecipe`s and every known recipe, including one known only
    through a hidden `CharacterRecipe` (the known limitation).
  - Output is masked when the output `GameCommonItem` is hidden.
  - `?name=` matches case-insensitively.
  - Ordered by `id`, paginated, `X-Skip-Cache: true`.
- **available/all:**
  - Only DM/admin get through. A PC's owning player is rejected (no owner leniency).
  - Hidden recipes are included, `hidden` is present and the real output is returned.
  - `X-Skip-Cache: true`.
- **acquire:**
  - `400` for another game's recipe, both when that recipe is hidden and when it is visible,
    with an identical body.
  - `404` for an unknown recipe or a hidden recipe.
  - `422` for an already-known recipe (E4), including one known through a hidden row.
  - `400` for a missing or non-integer `game_recipe_id`.
  - `201` with the plain shape: no `hidden`, masked output.
  - The new row's `hidden` copies `GameRecipe.hidden`, and a `hidden` sent in the body is
    ignored.
  - Permission denials for non-members.
- **acquire/all:**
  - GameEdit only.
  - A hidden `GameRecipe` is accepted, and the row gets `hidden=True`.
  - `201` with the `/full.json` shape.
  - The same `400`/`422` rules apply.
- **remove:**
  - `204`, the row is deleted and the `GameRecipe` still exists.
  - `404` when the recipe is not known (E8) or is known through a hidden row (E6).
  - Permission denials.
- **remove/all:**
  - PC: CharacterEdit, so the owner is allowed. NPC: GameEdit.
  - Can remove a hidden row (E6).
- **E7:** on a hidden NPC, every one of the six endpoints returns `404` to a non-editor, even
  one with `regular.create` rights. Assert the permission check is not what fails: a player
  gets `404`, not `403`.
- **X-Skip-Cache:** every write response, including error responses, carries it.
- **Permission flags:** extend `games/tests/views/permissions/game_pc_permissions_test.py` and
  `game_npc_permissions_test.py` for `can_exchange_recipe`: true for staff and player (via
  `?role=`), false for owner-only and anonymous callers.
- **URL resolution:** add or adjust any URL-name tests that enumerate character routes.

## Files to Change
- `backend/games/tests/views/game/pcs/detail/recipes/game_pc_recipes_available_test.py` — new
- `backend/games/tests/views/game/pcs/detail/recipes/game_pc_recipes_available_all_test.py` — new
- `backend/games/tests/views/game/pcs/detail/recipes/detail/game_pc_recipe_{acquire,acquire_all,remove,remove_all}_test.py` — new
- `backend/games/tests/views/game/npcs/detail/recipes/...` — NPC equivalents
- `backend/games/tests/views/permissions/game_pc_permissions_test.py` — `can_exchange_recipe`
- `backend/games/tests/views/permissions/game_npc_permissions_test.py` — `can_exchange_recipe`
