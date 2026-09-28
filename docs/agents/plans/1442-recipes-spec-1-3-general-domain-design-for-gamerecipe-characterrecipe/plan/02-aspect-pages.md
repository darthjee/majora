# Write the aspect pages

Create the five pages under `docs/agents/specs/recipes/`, each opening with a one-paragraph
purpose statement and linking back to the index. Content, transcribed from #1441:

- **`game-recipe.md`** — fields: `game`; `name`; `description` (markdown); `photo` (own
  `GameRecipePhoto`, single always-replaced photo like `GameCommonItemPhoto`); `hidden`;
  `game_common_item` (required FK, same game, editable via PATCH, `on_delete=CASCADE`, several
  recipes may produce the same item); `yield_quantity` (int, min 1, default 1); `crafting_time`
  (free text, max 200, default `''`); `crafting_cost` (int in the lowest denomination like
  `GameCommonItem.price` / `Treasure.value`, min 0, default 0, shown via `TreasureMoney`);
  `ingredients` and `checks` (free-text markdown, default `''`; `checks` lists skill/difficulty
  options any of which a character may use); detail-only fields: `description`, `ingredients`,
  `checks`. Duplicate names allowed. `HistoricalRecords` like sibling models
  (`backend/games/models/game/game_common_item.py`). Validation: cross-game output → `400`.
- **`character-recipe.md`** — thin join modeled on `CharacterPossession`
  (`backend/games/models/character/character_possession.py`): `character`, `game_recipe`, own
  `hidden`; unique `(character, game_recipe)`; display fields from the `GameRecipe`; same-game
  check (`400`); only existing recipes can be linked (no create-from-scratch); available /
  acquire / `acquire/all` / remove flow.
- **`visibility.md`** — default hidden-gated collection pattern
  (`docs/agents/access-control/principles.md`); output masking (`null` on plain endpoints when
  the output item is hidden, including inside CharacterRecipe responses; masked recipes never
  match a `?category=` filter, GM variants filter on the real category); `CharacterRecipe.hidden`
  independent of `GameRecipe.hidden`; new link copies `GameRecipe.hidden`; hidden recipes
  excluded from `available` and `404` on regular acquire; hidden-NPC gate / incognito cascade;
  recipe → characters list `404`s for a hidden recipe and excludes hidden links and
  hidden/incognito NPCs.
- **`deletion.md`** — `GameCommonItem` deletion (admin only) cascades to its recipes and their
  CharacterRecipes; no GameRecipe delete endpoint (admin only); CharacterRecipe remove leaves the
  GameRecipe untouched; character deletion cascades to its CharacterRecipes.
- **`permissions.md`** — summary: GameRecipe create/edit/photo = staff + any player (like
  `backend/permissions/config/game_common_item/endpoints.yml`); reads per hidden-gated pattern;
  `can_create_recipe` flag on `GET /permissions/game.json`; CharacterRecipe link/remove on the
  regular tier (PC: staff, player, owner; NPC: staff, player), like CharacterDocument;
  `acquire/all` GameEdit; frontend variant selection via `RequestStore` /
  `RequestPermissionResolvers.js`. Link forward to `api-contract.md` (#1443) for per-endpoint
  detail.

## Files to Change

- `docs/agents/specs/recipes/game-recipe.md` — new
- `docs/agents/specs/recipes/character-recipe.md` — new
- `docs/agents/specs/recipes/visibility.md` — new
- `docs/agents/specs/recipes/deletion.md` — new
- `docs/agents/specs/recipes/permissions.md` — new
