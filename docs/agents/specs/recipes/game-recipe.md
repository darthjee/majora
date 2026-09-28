# GameRecipe

The per-game recipe entity: its fields, validation rules and relationships.
Part of the [Recipes spec](../recipes.md).

## Fields

| Field | Type | Rules |
|-------|------|-------|
| `game` | FK to `Game` | Owning game |
| `name` | string | Required; duplicate names within a game are allowed (same as `GameCommonItem`) |
| `description` | text (markdown) | Detail endpoints only |
| `photo` | own `GameRecipePhoto` model | Single, always-replaced photo, like `GameCommonItemPhoto` |
| `hidden` | boolean | See [Visibility](visibility.md) |
| `game_common_item` | FK to `GameCommonItem` | The output item — see below |
| `yield_quantity` | integer | Units produced per crafting; `min_value=1`, defaults to `1` |
| `crafting_time` | string | Optional free text (e.g. "8 hours"); `max_length=200`, defaults to `''` |
| `crafting_cost` | integer | Lowest currency denomination, like `GameCommonItem.price` / `Treasure.value`; `min_value=0`, defaults to `0` |
| `ingredients` | text (markdown) | Free text, blank, defaults to `''`; detail endpoints only |
| `checks` | text (markdown) | Free text, blank, defaults to `''`; detail endpoints only |

Change history is tracked with `HistoricalRecords`, like the sibling models
(`backend/games/models/game/game_common_item.py`).

## Output item (`game_common_item`)

- Exactly one output item per recipe.
- **Required** on create and **editable** via `PATCH`.
- Must belong to the same game as the recipe, on both create and update;
  otherwise the request is rejected with `400`.
- Plain FK with no uniqueness: several recipes may produce the same
  `GameCommonItem` (e.g. different methods for the same potion).
- `on_delete=CASCADE` — see [Deletion](deletion.md).

## Free-text fields

- `ingredients` — no ingredient entity; edited and rendered with the existing
  `MarkdownEditor`, like `description`.
- `checks` — no skill-check entity; describes the skill/difficulty options,
  any of which a character can use (e.g. "Alchemy DC 15 or Herbalism DC 18").
  Same editor and exposure as `ingredients`.
- `description`, `ingredients` and `checks` are exposed on detail endpoints
  only, not on index endpoints.

## Money display

`crafting_cost` is displayed through `TreasureMoney` and edited through
`MoneyEditModal` (`context="treasure"`), exactly like `CommonItemPriceField`.

## Relationships

- `Game` 1 — N `GameRecipe`
- `GameCommonItem` 1 — N `GameRecipe` (output)
- `GameRecipe` 1 — 1 `GameRecipePhoto`
- `GameRecipe` 1 — N [`CharacterRecipe`](character-recipe.md)
