# Permission config

Declare who can create and edit recipes, and wire the UI flags.

- Create `game_recipe/endpoints.yml` with `regular: {create: [staff, player], edit: [staff,
  player]}`. Copy it from `game_common_item/endpoints.yml`, keep the header comment, and leave out
  `photo_upload`.
- Create `game_recipe/ui.yml` with `edit: [staff, player]`.
- Create `pages/game_recipe.yml` with `game_recipe: {edit: can_edit}`.
- Add `create_recipe: [staff, player]` to `game/ui.yml`.
- Add `create_recipe: can_create_recipe` under the `game:` key of `pages/game.yml`.

## Files to Change

- `backend/permissions/config/game_recipe/endpoints.yml` — new
- `backend/permissions/config/game_recipe/ui.yml` — new
- `backend/permissions/config/pages/game_recipe.yml` — new
- `backend/permissions/config/game/ui.yml` — add `create_recipe`
- `backend/permissions/config/pages/game.yml` — add `create_recipe: can_create_recipe`
