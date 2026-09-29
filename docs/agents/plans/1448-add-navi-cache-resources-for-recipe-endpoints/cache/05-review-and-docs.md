# X-Skip-Cache review and docs
Read-only review: confirm that every restricted or write recipe view sets `X-Skip-Cache: true`
(game `recipes/all.json`, `recipes/<id>/full.json`, `recipes/<id>/characters/all.json`,
`common_items/<id>/recipes/all.json`, POST/PATCH recipes; PC/NPC `recipes/all.json`,
`recipes/<id>/full.json`, `available.json`, `available/all.json`, `acquire*`, `remove*`, PATCH
`hidden`), and that NPC plain reads set it when served through the hidden-NPC gate. Views live under
`backend/games/views/game/recipes/`, `backend/games/views/game/common_items/detail/`,
`backend/games/views/game/pcs/detail/recipes/`, `backend/games/views/game/npcs/detail/recipes/` and
`backend/games/views/game/_character/recipes/`. Report violations in the PR; do not edit backend code.

Then update `docs/agents/cache-warmer.md`: add `recipes.yml` to the resource-file list (and fix the
file count), and mention the new recipe resources in the `common_items.yml`, `pcs.yml`, `npcs.yml`,
`games.yml` and `permissions.yml` bullets.

## Files to Change
- `docs/agents/cache-warmer.md` — document the new resource file and resources.
