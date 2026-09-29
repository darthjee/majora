# Issue: Add CharacterRecipe available/acquire/remove endpoints and can_exchange_recipe flag

## Description
Part of #1441 (crafting recipes). This was split out of #1447 (now merged), which added the `CharacterRecipe` model and its read/PATCH endpoints. This issue adds the flow for linking and unlinking recipes on PCs and NPCs (available / acquire / remove) and the `can_exchange_recipe` permission flag.

The API contract is binding: `docs/agents/specs/recipes/api-contract.md` ("Available (acquire catalog)", "Acquire and remove", "Permissions"), plus `docs/agents/specs/recipes/permissions.md` and `visibility.md`.

Out of scope: Navi (#1448) and frontend (#1450).

## Problem
`CharacterRecipe` rows can be read and patched, but there is no way to create or delete them. Players and GMs cannot give a character a recipe or take one away, and the frontend has no permission flag to gate an "Exchange" trigger.

## Expected Behavior
All routes exist under both `/games/<slug>/pcs/<id>/recipes/...` and `/games/<slug>/npcs/<id>/recipes/...`.

### Available (acquire catalog)
| Endpoint | Method | PC | NPC | Behavior |
|----------|--------|----|-----|----------|
| `available.json` | GET | `regular.create` (staff, player) | `regular.create` (staff, player) | The game's recipes minus hidden `GameRecipe`s and recipes the character already knows. Game recipe index shape, output masked when hidden. |
| `available/all.json` | GET | GameEdit (no owner leniency) | GameEdit | Includes hidden `GameRecipe`s, still minus the ones already known. Adds `hidden` (= `GameRecipe.hidden`) and returns the real output. |

- `?name=`: case-insensitive substring match on `GameRecipe.name`. No `?category=`.
- Paginated, ordered by `id`.
- Both always set `X-Skip-Cache: true`. Unlike the sibling `available.json` endpoints, these are gated, so there is no Navi resource.

### Acquire and remove
All four take `{ "game_recipe_id": <id> }` in the POST body.

| Endpoint | PC | NPC | Behavior |
|----------|----|-----|----------|
| `acquire.json` | `regular.create` | `regular.create` | Creates a `CharacterRecipe` with `hidden` copied from `GameRecipe.hidden`. Errors, in this order: `400` if the recipe belongs to another game, regardless of its `hidden`; `404` if it is unknown or hidden; `422` if the character already knows it (E4). Success: `201` with the plain detail shape (no `hidden`, output masked if hidden). |
| `acquire/all.json` | GameEdit | GameEdit | Same, but no `404` on a hidden `GameRecipe`. There is no `hidden` override in the body. Success: `201` with the `/full.json` shape. |
| `remove.json` | `regular.create` | `regular.create` | Deletes the link and returns `204`. Returns `404` if the character does not know the recipe (E8) or knows it only through a hidden `CharacterRecipe` (E6). |
| `remove/all.json` | CharacterEdit | GameEdit | Same, but can also remove hidden links. This is the only way to remove one (E6). |

- Remove never touches the `GameRecipe`.
- E7: on NPC routes, the hidden-NPC gate runs before the permission check.
- Every write sets `X-Skip-Cache: true`.
- Accepted known limitation (same as `CharacterDocument`): if a recipe is known only through a hidden `CharacterRecipe`, it is still left out of `available.json` and acquiring it still returns `422`.

### Permissions
- New `backend/permissions/config/game_pc_recipe/endpoints.yml` and `game_npc_recipe/endpoints.yml`, each with `regular.create: [staff, player]`.
- New `can_exchange_recipe` flag on `GET /permissions/game_pc.json` and `game_npc.json`, with roles taken from those files. It follows the `can_create_possession` / `can_exchange_treasure` wiring (`permissions/config/pages/character_pc.yml` / `character_npc.yml`).

### Docs and tests
- Extend `docs/agents/access-control/character-recipe.md` with these endpoints.
- Add tests for every edge case above: E4–E8, the 400/404/422 order, the masked vs real output, the `hidden` copy on acquire, and `X-Skip-Cache` on every response.

## Solution
Mirror the available/acquire/remove views of `CharacterDocument` and its `game_pc_document` / `game_npc_document` `endpoints.yml` layout (`regular.create` only; this issue needs no `restricted` block). Reuse the `CharacterRecipe` serializers and output masking added in #1447, and the game recipe index serializer for the available lists. Wire `can_exchange_recipe` the same way `can_create_possession` is wired: a `game_pc_recipe` / `game_npc_recipe` entry in the character page configs.
