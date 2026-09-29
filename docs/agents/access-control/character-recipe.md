# CharacterRecipe

**[Game resource](principles.md#resource-categories).** `CharacterRecipe` records that a
`Character` (PC or NPC) knows a [GameRecipe](game-recipe.md) (issue #1447). A thin join
modeled on [CharacterPossession](character-possession.md): every display field (`name`,
`yield_quantity`, `crafting_time`, `crafting_cost`, `description`, `ingredients`, `checks`,
`output`) is sourced straight from the linked `GameRecipe`, with no copies. `hidden` is the
row's own flag, independent of `GameRecipe.hidden`. `unique_together = ('character',
'game_recipe')`. Deleting the `Character`, the `GameRecipe` or the recipe's output
`GameCommonItem` cascades to the row. Change history is tracked (see
[versioning](versioning.md)).

The index/detail pairs follow the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern). The only write on the row
itself is the `hidden`-only `PATCH` below. The available / acquire / remove flow (and the
`game_pc_recipe` / `game_npc_recipe` `endpoints.yml` files and the `can_exchange_recipe` flag)
arrives in #1459.

## Index and detail endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs/<id>/recipes.json` | GET | **AllowAny** — non-hidden rows, output masked |
| `/games/<slug>/pcs/<id>/recipes/all.json` | GET | **CharacterEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/recipes.json` | GET | **AllowAny**, plus the [hidden-NPC gate](character-photo.md#hidden-npc-gate) |
| `/games/<slug>/npcs/<id>/recipes/all.json` | GET | **GameEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/pcs/<id>/recipes/<character_recipe_id>.json` | GET | **AllowAny** — 404 if the row is hidden, unknown or belongs to another character |
| `/games/<slug>/pcs/<id>/recipes/<character_recipe_id>/full.json` | GET | **CharacterEdit** — returns even if hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/recipes/<character_recipe_id>.json` | GET | **AllowAny**, plus the hidden-NPC gate, same 404s |
| `/games/<slug>/npcs/<id>/recipes/<character_recipe_id>/full.json` | GET | **GameEdit** (no owner concept for NPCs) |
| `/games/<slug>/pcs/<id>/recipes/<character_recipe_id>.json` | PATCH | **CharacterEdit** — `hidden` only. Always `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/recipes/<character_recipe_id>.json` | PATCH | **GameEdit** — `hidden` only. Always `X-Skip-Cache: true` |

- `<character_recipe_id>` is the `CharacterRecipe` row id, looked up among **that character's
  own rows** only; an id belonging to another character returns `404`.
- The indexes are paginated (`?page=` / `?per_page=`), ordered by `id`, and support `?name=`
  (case-insensitive substring on `GameRecipe.name`).
- On NPCs the hidden-NPC gate runs **before** the permission check on every endpoint, including
  `/all.json`, `/full.json` and `PATCH`: a hidden NPC the caller cannot view is always `404`,
  never `401`/`403`. Plain NPC endpoints served to an authorized dm/superuser through the gate
  set `X-Skip-Cache: true`. Plain PC endpoints set no `X-Skip-Cache`.
- NPC `incognito` has no effect on these endpoints.

## Fields

Index: `id` (the `CharacterRecipe` row id), `game_recipe_id`, `name`, `yield_quantity`,
`crafting_time`, `crafting_cost`, `output`. Detail adds `description`, `ingredients` and
`checks`. `/all.json` / `/full.json` (and the `PATCH` response) add `hidden` — always
`CharacterRecipe.hidden`, never `GameRecipe.hidden`.

## Hidden rules

- **E9 — `GameRecipe.hidden` is ignored** on character endpoints: a visible `CharacterRecipe`
  whose `GameRecipe` is hidden is still listed and returned by the plain endpoints. Only
  `CharacterRecipe.hidden` filters.
- **Output masking** works as on [GameRecipe](game-recipe.md#output-masking): a hidden output
  `GameCommonItem` is returned as `output: null` (the whole object). Masking depends on the
  **caller**, not only on the endpoint:
  - plain endpoints always mask, for everyone;
  - the restricted variants (`/all.json`, `/full.json`, `PATCH` response) return the real output
    only when the caller has `GameEdit` on the game. On PCs, the owning player reaches these
    variants through `CharacterEdit` but, without `GameEdit`, still sees a hidden output as
    `null`: owning a character never grants visibility of a hidden `GameCommonItem`.

## Toggling `hidden` (PATCH)

Checks run in this order, so a non-editor never observes whether a given
`character_recipe_id` exists:

1. **NPC only:** the hidden-NPC gate (`404`).
2. **Authorization:** CharacterEdit (PCs) / GameEdit (NPCs) — `401` unauthenticated, `403`
   unauthorized.
3. **Row lookup** among the character's own rows, **including hidden ones** — `404` for an
   unknown or other-character id.
4. **Update:** only `hidden` (boolean) is written; any other field in the body is ignored. A
   non-boolean `hidden` returns `400`.

The response uses the `/full.json` shape with the caller-dependent output masking above. On PCs,
`CharacterEdit` includes the owning player, so the owner can unhide a row that copied
`GameRecipe.hidden = true`; by E9 this publishes the recipe's display fields on the PC's plain
endpoints (the output stays masked if hidden). This is an accepted consequence of the tier.
