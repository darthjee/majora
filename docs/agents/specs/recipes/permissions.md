# Permissions

Permissions summary for recipes. Part of the [Recipes spec](../recipes.md).
Per-endpoint routes and tiers are defined in the
[API contract](api-contract.md).

## GameRecipe

- **Create / edit (`PATCH`)**: staff + any player of the game —
  the same regular tier as `GameCommonItem`
  (`backend/permissions/config/game_common_item/endpoints.yml`), in its own
  `game_recipe/endpoints.yml`.
- **Reads** follow the hidden-gated pattern: plain variants are `AllowAny`;
  `/all.json` / `/full.json` require `GameEdit`.
- A `can_create_recipe` flag on `GET /permissions/game.json` gates the UI
  create link.
- No delete endpoint (admin only) — see [Deletion](deletion.md).
- No photo upload: recipes have no uploads of any kind.

## CharacterRecipe

- Only linking an **existing** `GameRecipe` — no create-from-scratch from the
  character page.
- available / acquire / remove on the **regular** tier (`regular.create`:
  staff, player), like `CharacterDocument`.
- Configured in `game_pc_recipe` / `game_npc_recipe` `endpoints.yml`.
- `available/all` / `acquire/all` (`GameEdit`) are the GM-only variants that
  can see and link hidden recipes.
- `remove/all` (`CharacterEdit` for PCs, `GameEdit` for NPCs) removes a hidden
  `CharacterRecipe`.
- `PATCH .../recipes/<character_recipe_id>.json` toggles `CharacterRecipe.hidden`
  only — `CharacterEdit` for PCs, `GameEdit` for NPCs.
- A `can_exchange_recipe` flag on `GET /permissions/game_pc.json` /
  `game_npc.json` (roles from `regular.create`) gates the UI acquire/remove
  trigger.
- Plain / `all` index and detail follow the hidden-gated pattern
  (`CharacterEdit` for PCs, `GameEdit` for NPCs on the restricted variants).

## Frontend

Endpoint-variant selection in the frontend goes through `RequestStore` /
`RequestPermissionResolvers.js`, per `docs/agents/issue-enhancement.md`.
