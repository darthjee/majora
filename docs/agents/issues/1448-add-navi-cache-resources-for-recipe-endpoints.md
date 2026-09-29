# Issue: Add Navi cache resources for recipe endpoints

## Description
Part of #1441 (crafting recipes). The recipe backend endpoints (#1445, #1446, #1447, #1459) are merged, but none of their plain (`AllowAny`) GET variants are warmed by Navi yet. This issue adds the Navi resources, following the list in [API contract — Shortlists and Navi](docs/agents/specs/recipes/api-contract.md#shortlists-and-navi). The owner is the `cache` agent.

## Problem
- `navi/resources/` has no recipe resources, so the game recipe index and detail pages, the common item "Recipes that produce it" shortlist, the recipe "Known by" shortlist, the PC/NPC recipe lists and details, and `/permissions/game_recipe.json` all go uncached.
- The frontend issues (#1449, #1450) will request the `?per_page=5` shortlist URLs, and those are uncached too.

## Expected Behavior
Navi warms every plain recipe GET URL and chains each one from its parent resource:

| URL | Resource(s) | Chained from |
|---|---|---|
| `/games/{slug}/recipes.json` | `game_recipes` + `paginated_game_recipes` | the game resource in `games.yml`, next to `game_common_items` / `game_possessions` |
| `/games/{slug}/recipes/{id}.json` | `game_recipe_detail` | each `paginated_game_recipes` entry |
| `/games/{slug}/recipes/{id}/characters.json` | paginated resource + `short_recipe_characters` (`?per_page=5`) | `game_recipe_detail` |
| `/games/{slug}/common_items/{id}/recipes.json` | paginated resource + `short_common_item_recipes` (`?per_page=5`) | `game_common_item_detail` |
| `/games/{slug}/pcs/{id}/recipes.json` | `pc_recipes` + paginated + `short_pc_recipes` (`?per_page=5`) | the `pc` resource, like `pc_documents` / `short_pc_documents` |
| `/games/{slug}/pcs/{id}/recipes/{character_recipe_id}.json` | `pc_recipe_detail` | each paginated `pc_recipes` entry |
| `/games/{slug}/npcs/{id}/recipes.json` + detail | same shape as the PC resources (`short_npc_recipes`, etc.) | the `npc` resource |
| `/permissions/game_recipe.json` | `permissions_game_recipe`, with the same `?role=` variants as `permissions_game_document` | same wiring as the other entity permission resources |

Never warmed: every `/all.json` and `/full.json`, `recipes/available.json` and `available/all.json` (authenticated, per-character, always `X-Skip-Cache: true`), and every POST/PATCH write endpoint.

## Solution
- Add a new `navi/resources/recipes.yml` (game recipe index/detail, recipe characters, and the common item recipes resources, or the latter in `common_items.yml`), include it in `navi/navi_config.yaml`, and add the chaining actions in `games.yml`, `common_items.yml`, `pcs.yml` and `npcs.yml`.
- Add `permissions_game_recipe` to `navi/resources/permissions.yml`.
- Read-only check: confirm every restricted recipe variant (`/all.json`, `/full.json`, `available*`, `acquire*`, `remove*`, PATCH) sets `X-Skip-Cache: true`, and that plain NPC reads set it when served through the hidden-NPC gate to a dm/superuser. Report any violation instead of fixing it (backend-owned).
- Update `docs/agents/cache-warmer.md` if it lists resources or chaining that changed.

## Benefits
- Recipe pages and shortlists are served from cache, like every other game entity.
- Navi coverage stays in sync with the API surface introduced by #1441.
