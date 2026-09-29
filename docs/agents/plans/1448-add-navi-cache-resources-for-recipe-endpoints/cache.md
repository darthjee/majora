# Cache Plan: Add Navi cache resources for recipe endpoints

Main plan: [plan.md](plan.md)

## Overview
Warm every plain recipe GET URL listed in
[API contract — Shortlists and Navi](../../specs/recipes/api-contract.md#shortlists-and-navi),
chaining each resource from the one whose page links to it, following the existing
`factions.yml` / `common_items.yml` / `pcs.yml` / `npcs.yml` patterns.

## Context
- Backend routes are merged (#1445, #1446, #1447, #1459): `backend/games/urls/games.py`
  (game recipes, recipe characters, common item recipes), `backend/games/urls/_character_routes.py`
  (PC/NPC recipes) and `backend/games/urls/permissions.py` (`permissions/game_recipe.json`).
- All index endpoints are paginated (`pages` / `per_page` headers), like the other listings.
- Shortlists use `?per_page=5` on the plain index (frontend #1449 / #1450).
- Never warmed: `/all.json`, `/full.json`, `recipes/available.json`, `recipes/available/all.json`,
  and every POST/PATCH endpoint (`acquire*`, `remove*`, create/edit, `hidden` toggle).

## Steps

- [01 — Game recipes and recipe characters](cache/01-game-recipes.md)
- [02 — Common item recipes](cache/02-common-item-recipes.md)
- [03 — PC and NPC recipes](cache/03-character-recipes.md)
- [04 — Game recipe permissions](cache/04-permissions.md)
- [05 — X-Skip-Cache review and docs](cache/05-review-and-docs.md)

## CI Checks
- `navi`: `.claude/scripts/check_cache.sh` (YAML parse of `navi/navi_config.yaml` and every
  `navi/resources/*.yml`). The CircleCI `warm_navi_cache.sh config` push runs only on deploy.

## Notes
- Placeholder names inside a URL template must match the `parameters` keys passed by the parent
  action (e.g. `{:recipe_id}` ↔ `recipe_id: parsedBody.id`), as in `npc_item_detail`.
- The plain indexes already exclude hidden recipes / hidden `CharacterRecipe` rows, so chained
  detail URLs never hit a `404`. Hidden NPCs are not reachable from the plain `game_npcs` chain, so
  the NPC hidden-gate `X-Skip-Cache` path is never exercised by Navi.
- If a restricted variant is found not to send `X-Skip-Cache: true`, report it (backend-owned);
  do not change backend code.
