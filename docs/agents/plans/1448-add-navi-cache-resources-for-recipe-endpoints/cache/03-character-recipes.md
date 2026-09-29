# PC and NPC recipes
Mirror the `*_items` shape (index + paginated + detail + shortlist) in both character files.

`navi/resources/pcs.yml`:
- On `pc` actions add `pc_recipes` and `short_pc_recipes` (`slug: parsedBody.game_slug`,
  `id: parsedBody.id`), next to `pc_possessions` / `short_pc_possessions`.
- `pc_recipes` — `/games/{:slug}/pcs/{:id}/recipes.json`, paginated → `paginated_pc_recipes`.
- `paginated_pc_recipes` — `/games/{:slug}/pcs/{:id}/recipes.json?page={:page}&per_page={:per_page}`,
  `actions` → `pc_recipe_detail` (`slug: parameters.slug`, `id: parameters.id`,
  `recipe_id: parsedBody.id` — the `CharacterRecipe` row id).
- `pc_recipe_detail` — `/games/{:slug}/pcs/{:id}/recipes/{:recipe_id}.json`.
- `short_pc_recipes` — `/games/{:slug}/pcs/{:id}/recipes.json?per_page=5`.

`navi/resources/npcs.yml`: same four resources named `npc_recipes`, `paginated_npc_recipes`,
`npc_recipe_detail`, `short_npc_recipes`, chained from `npc`.

## Files to Change
- `navi/resources/pcs.yml` — PC recipe resources and chaining from `pc`.
- `navi/resources/npcs.yml` — NPC recipe resources and chaining from `npc`.
