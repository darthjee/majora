# Access-control docs

- In `docs/agents/access-control/game-recipe.md`:
  - add the POST and PATCH endpoints, the write field allowlist, E1–E3, `X-Skip-Cache`, and the
    `can_create_recipe` / `/permissions/game_recipe.json` flags;
  - remove any "read endpoints only" wording.
- In `docs/agents/access-control/game.md`, add a `can_create_recipe` bullet next to
  `can_create_common_item`.

## Files to Change

- `docs/agents/access-control/game-recipe.md` — write endpoints and flags
- `docs/agents/access-control/game.md` — `can_create_recipe` bullet
