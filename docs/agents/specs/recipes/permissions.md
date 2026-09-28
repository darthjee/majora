# Permissions

Permissions summary for recipes. Part of the [Recipes spec](../recipes.md).
Per-endpoint routes and tiers are defined in the API contract
(`api-contract.md`, pending — added by #1443).

## GameRecipe

- **Create / edit (`PATCH`) / photo upload**: staff + any player of the game —
  the same regular tier as `GameCommonItem`
  (`backend/permissions/config/game_common_item/endpoints.yml`), in its own
  `game_recipe/endpoints.yml`.
- **Reads** follow the hidden-gated pattern: plain variants are `AllowAny`;
  `/all.json` / `/full.json` require `GameEdit`.
- A `can_create_recipe` flag on `GET /permissions/game.json` gates the UI
  create link.
- No delete endpoint (admin only) — see [Deletion](deletion.md).

## CharacterRecipe

- Only linking an **existing** `GameRecipe` — no create-from-scratch from the
  character page.
- available / acquire / remove on the **regular** tier, like
  `CharacterDocument`:
  - PCs: staff, player, owner
  - NPCs: staff, player
- Configured in `game_pc_recipe` / `game_npc_recipe` `endpoints.yml`.
- `acquire/all` (`GameEdit`) is the GM-only variant that can link hidden
  recipes.
- Plain / `all` index and detail follow the hidden-gated pattern
  (`CharacterEdit` for PCs, `GameEdit` for NPCs on the restricted variants).

## Frontend

Endpoint-variant selection in the frontend goes through `RequestStore` /
`RequestPermissionResolvers.js`, per `docs/agents/issue-enhancement.md`.
