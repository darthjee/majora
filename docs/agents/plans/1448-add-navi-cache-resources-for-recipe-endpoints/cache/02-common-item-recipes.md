# Common item recipes
In `navi/resources/common_items.yml`, give `game_common_item_detail` an `actions` list pointing at
`game_common_item_recipes` and `short_common_item_recipes` (`slug: parameters.slug`,
`id: parameters.id`), and add:

- `game_common_item_recipes` — `/games/{:slug}/common_items/{:id}/recipes.json`, paginated →
  `paginated_game_common_item_recipes`
  (`/games/{:slug}/common_items/{:id}/recipes.json?page={:page}&per_page={:per_page}`).
- `short_common_item_recipes` — `/games/{:slug}/common_items/{:id}/recipes.json?per_page=5`.

The plain `common_items` chain only reaches visible common items, so these never `404`.

## Files to Change
- `navi/resources/common_items.yml` — new actions on `game_common_item_detail` and the new resources.
