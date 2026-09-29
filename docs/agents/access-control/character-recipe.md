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
itself is the `hidden`-only `PATCH` below. Rows are created and deleted through the
[available / acquire / remove](#available--acquire--remove-endpoints) flow (issue #1459), gated
by the `game_pc_recipe` / `game_npc_recipe` [permission files](#permissions) and surfaced to the
frontend through the `can_exchange_recipe` flag.

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

## Available / acquire / remove endpoints

Issue #1459. Structure mirrors
[CharacterDocument](character-document.md#document-acquireremove-endpoints), with
recipe-specific tiers, error order and masking. All routes exist under both
`/games/<slug>/pcs/<id>/recipes/...` and `/games/<slug>/npcs/<id>/recipes/...`. The acquire and
remove endpoints take `{ "game_recipe_id": <id> }` in the POST body. **Every response** (success,
validation error, permission denial, `404`) sets `X-Skip-Cache: true`.

| Endpoint | Method | PC | NPC | Behavior |
|----------|--------|----|-----|----------|
| `.../recipes/available.json` | GET | `regular.create` (staff, player) | `regular.create` (staff, player) | The game's recipes minus hidden `GameRecipe`s and recipes the character already knows. Game recipe index shape, output masked |
| `.../recipes/available/all.json` | GET | **GameEdit** (no owner leniency) | **GameEdit** | Includes hidden `GameRecipe`s, still minus known ones. Adds `hidden` (= `GameRecipe.hidden`) and returns the real output |
| `.../recipes/acquire.json` | POST | `regular.create` | `regular.create` | Creates a `CharacterRecipe`; `hidden` copied from `GameRecipe.hidden`. `201` with the plain detail shape (no `hidden`, output masked) |
| `.../recipes/acquire/all.json` | POST | **GameEdit** | **GameEdit** | Same, but does not `404` on a hidden `GameRecipe`. `201` with the `/full.json` shape (real output) |
| `.../recipes/remove.json` | POST | `regular.create` | `regular.create` | Deletes the character's row for that recipe, `204` |
| `.../recipes/remove/all.json` | POST | **CharacterEdit** | **GameEdit** | Same, but can also remove a hidden row — the only way to remove one (E6) |

- **Available lists:** paginated (`?page=` / `?per_page=`), ordered by `id`, `?name=`
  (case-insensitive substring on `GameRecipe.name`); no `?category=`. Unlike sibling
  `available.json` endpoints (AllowAny), these are gated, so they are never cached and have no
  Navi resource.
- **Acquire error order:** `400` for a missing or non-integer `game_recipe_id`; then `400`
  (`game_recipe_from_another_game`) if the `GameRecipe` belongs to another game — checked first
  and regardless of that recipe's `hidden`, so the response never depends on another game's
  hidden state; then `404` if it is unknown, or hidden on the plain variant; then **`422`**
  (`game_recipe_already_known`) if the character already knows it (E4). There is no `hidden`
  override in the body: the new row always copies `GameRecipe.hidden`, and the GM toggles it
  afterwards via `PATCH`.
- **Remove:** `404` if the character does not know the recipe (E8), or, on the plain variant,
  knows it only through a hidden row (E6). Remove never touches the `GameRecipe`.
- **E7 — hidden-NPC gate first:** on NPC routes the [hidden-NPC
  gate](character-photo.md#hidden-npc-gate) runs before **every** permission check, including
  `regular.create`: a player with exchange rights still gets `404`, not `403`, on a hidden NPC.
- Catalog visibility (`available/all`, `acquire/all`) is game-level (GameEdit, no owner);
  owned-row visibility (`remove/all`) is character-level (CharacterEdit for PCs), the same split
  as `CharacterDocument`.
- **Known limitation** (same as `CharacterDocument`): a recipe known only through a hidden
  `CharacterRecipe` is still left out of `available.json` and still returns `422` on
  `acquire.json`, so a regular-tier caller can infer that a hidden link exists, though not its
  contents.

## Permissions

- [`game_pc_recipe/endpoints.yml`](../../../backend/permissions/config/game_pc_recipe/endpoints.yml)
  and
  [`game_npc_recipe/endpoints.yml`](../../../backend/permissions/config/game_npc_recipe/endpoints.yml):
  `regular.create: [staff, player]` only, gating the plain `available` / `acquire` / `remove`
  endpoints. There is no `restricted` block: the `/all` variants use the standard GameEdit /
  CharacterEdit tiers. dm/admin always bypass.
- [`game_pc_recipe/ui.yml`](../../../backend/permissions/config/game_pc_recipe/ui.yml) and
  [`game_npc_recipe/ui.yml`](../../../backend/permissions/config/game_npc_recipe/ui.yml):
  `exchange: [staff, player]`, which **must mirror** `endpoints.yml`'s `regular.create`.
- `can_exchange_recipe` on `GET /permissions/game_pc.json` / `game_npc.json` (see
  [Character](character.md#edit-access-status--permission)), wired through the
  `game_pc_recipe` / `game_npc_recipe` entries of the `character_pc` / `character_npc` page
  configs, like `can_create_possession`. It gates the frontend acquire/remove ("exchange")
  trigger and follows the same real-identity vs. role-simulated dual path as `can_edit`.
