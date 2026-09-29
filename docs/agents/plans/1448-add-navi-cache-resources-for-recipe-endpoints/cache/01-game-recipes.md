# Game recipes and recipe characters
Create `navi/resources/recipes.yml` (with the standard `namespace: $NAVI_NAMEPACE` header) and add
it to the `include:` list of `navi/navi_config.yaml`.

Resources, mirroring `factions.yml`:

- `game_recipes` — `/games/{:slug}/recipes.json`, `paginated_actions` → `paginated_game_recipes`
  (`pages: headers['pages']`, `page_key: page`, `zero_indexed: false`,
  `per_page: headers['per_page']`).
- `paginated_game_recipes` — `/games/{:slug}/recipes.json?page={:page}&per_page={:per_page}`,
  `actions` → `game_recipe_detail` (`slug: parameters.slug`, `id: parsedBody.id`).
- `game_recipe_detail` — `/games/{:slug}/recipes/{:id}.json`, `actions` →
  `game_recipe_characters` and `short_recipe_characters` (`slug: parameters.slug`,
  `id: parameters.id`).
- `game_recipe_characters` — `/games/{:slug}/recipes/{:id}/characters.json`, paginated →
  `paginated_game_recipe_characters`
  (`/games/{:slug}/recipes/{:id}/characters.json?page={:page}&per_page={:per_page}`).
- `short_recipe_characters` — `/games/{:slug}/recipes/{:id}/characters.json?per_page=5`.

In `navi/resources/games.yml`, add `game_recipes` (`slug: parsedBody.game_slug`) to the same
per-game actions list that fans out to `game_common_items`, `game_possessions`, etc.

## Files to Change
- `navi/resources/recipes.yml` — new file with the resources above.
- `navi/navi_config.yaml` — add `resources/recipes.yml` to `include:`.
- `navi/resources/games.yml` — chain `game_recipes` from the per-game resource.
