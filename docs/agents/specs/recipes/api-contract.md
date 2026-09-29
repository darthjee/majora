# API contract

The API contract for `GameRecipe` and `CharacterRecipe`, implemented by #1445–#1450. Part of the
[Recipes spec](../recipes.md) (phase 2/3, #1443). Shapes follow the sibling access-control pages
[GameCommonItem](../../access-control/game-common-item.md),
[CharacterPossession](../../access-control/character-possession.md),
[CharacterDocument](../../access-control/character-document.md) and
[Faction](../../access-control/faction.md).

This page fixes routes, methods, permission tiers, `endpoints.yml` keys, request and response
fields, error codes, `X-Skip-Cache` behavior and whether a Navi resource is needed. It does not
name serializer or view classes, and does not define Navi resource contents (#1448) or frontend
placement (#1444).

Recipes have **no uploads of any kind**: no photo endpoint, no `GameRecipePhoto`, no recipe
`photo_path`.

## Conventions

- **Pagination:** every index endpoint uses standard pagination (`paginated_list_response`,
  `?page=` / `?per_page=`). That covers the game, common-item, character, `available` and
  `characters` listings.
- **Order:** by `id`, except `recipes/<id>/characters.json` (+ `/all.json`), which orders by
  character `name`, then `id` as a tiebreak.
- **Restricted variants** (`/all.json`, `/full.json`, `available/all.json`, and the
  `acquire/all` / `remove/all` / `hidden` PATCH write variants) always set
  `X-Skip-Cache: true`. Plain `AllowAny` reads set none, except where stated (the hidden-NPC
  gate serving an authorized dm/superuser sets it, as on sibling NPC sub-resources).
- **Write endpoints** (POST / PATCH) are never cached and always set `X-Skip-Cache: true`.
- **Navi:** only plain (`AllowAny`) GET URLs get Navi resources. Restricted variants and write
  endpoints never do. See [Shortlists and Navi](#shortlists-and-navi).
- **Error codes:** `400` validation error (including a cross-game or hidden-output reference
  that must not be distinguishable from "not in this game"), `401` unauthenticated on an
  authenticated-only endpoint, `403` authenticated but not permitted, `404` unknown / hidden /
  not reachable at the caller's tier, `422` duplicate `CharacterRecipe` on acquire. On NPC
  routes the hidden-NPC gate runs first: a hidden NPC the caller cannot view is always `404`,
  whether or not the caller is authenticated.
- **Query parameters:** `?category=` is matched by exact equality against the
  `GameCommonItem.category` choices (a value outside the choice list returns an empty list);
  `?name=` is an ORM case-insensitive substring match on `GameRecipe.name`, applied after the
  hidden / masking filters. Neither is ever interpolated into raw SQL. Parameters not listed for
  an endpoint (e.g. `?category=` on `available.json`) are ignored.
- **Id fields in bodies** (`game_recipe_id`, `game_common_item_id`) must be integers; missing or
  non-integer values return `400` (never `404` or `500`).
- **Mass assignment:** every write uses an explicit field allowlist; `id`, `game`, `character` and
  any unlisted field in the body have no effect. Implementation issues add a regression test per
  [mass-assignment](../../security-guidelines/mass-assignment.md).

## Response shapes

### Output object

The output `GameCommonItem` is embedded as a nested object:

```json
"output": { "id": 7, "name": "Healing Potion", "photo_path": "/uploads/.../7/photo.png", "category": "potion" }
```

- On plain (non-restricted) endpoints, `output` is **`null`** when the output item is hidden.
  The mask is the whole object, so adding output fields later can never leak partially.
- On restricted variants the output is returned in full **only when the caller has
  `GameEdit`** on the game: `recipes/all.json`, `recipes/<id>/full.json`,
  `common_items/<id>/recipes/all.json`, `recipes/available/all.json`, `recipes/acquire/all.json`,
  NPC `/all.json` / `/full.json`, and write responses for `GameEdit` callers (see E2).
- On the PC `CharacterEdit` variants (`pcs/<id>/recipes/all.json`, `.../full.json`, the PC
  `hidden` PATCH response), a caller without `GameEdit` (the PC's owning
  player) still gets `output: null` when the output item is hidden: owning a character never
  grants visibility of a hidden `GameCommonItem`.
- `output.photo_path` is the output common item's own existing photo — the only image on a
  recipe.

### Game recipe

| Variant | Fields |
|---------|--------|
| Index item (plain) | `id`, `name`, `yield_quantity`, `crafting_time`, `crafting_cost`, `output` |
| Index item (`/all.json`) | index item + `hidden` |
| Detail (plain) | index item + `description`, `ingredients`, `checks` |
| Detail (`/full.json`) | detail + `hidden` |

`description`, `ingredients` and `checks` are markdown text; they are exposed on detail variants
only.

Example index entries (visible output / masked output):

```json
{ "id": 12, "name": "Brew Healing Potion",
  "yield_quantity": 2, "crafting_time": "8 hours", "crafting_cost": 50,
  "output": { "id": 7, "name": "Healing Potion", "photo_path": "/uploads/.../7/photo.png", "category": "potion" } }

{ "id": 13, "name": "Mysterious Distillation",
  "yield_quantity": 1, "crafting_time": "", "crafting_cost": 120, "output": null }
```

### Character recipe entry

| Variant | Fields |
|---------|--------|
| Index item (plain) | `id` (the `CharacterRecipe` row), `game_recipe_id`, `name`, `yield_quantity`, `crafting_time`, `crafting_cost`, `output` |
| Index item (`/all.json`) | index item + `hidden` |
| Detail (plain) | index item + `description`, `ingredients`, `checks` |
| Detail (`/full.json`) | detail + `hidden` |

Display fields are sourced from the linked `GameRecipe`. `hidden` here is
**`CharacterRecipe.hidden`**, never `GameRecipe.hidden`. `output` is masked exactly as on game
recipes (see E9).

### Recipe → characters entry

| Variant | Fields |
|---------|--------|
| Plain | `id` (the **character** id), `name`, `photo_path` (the character's), `type` (`'pc'` / `'npc'`) |
| `/all.json` | plain + `hidden` (= `CharacterRecipe.hidden`) |

No `character_recipe_id`: toggling and removing happen from the character page.

## Game recipes

| Endpoint | Method | Who can call | `endpoints.yml` key |
|----------|--------|-------------|---------------------|
| `/games/<slug>/recipes.json` | GET | **AllowAny** — non-hidden recipes, output masked | — |
| `/games/<slug>/recipes/all.json` | GET | **GameEdit** — includes hidden, adds `hidden`, real output. Always `X-Skip-Cache: true` | — |
| `/games/<slug>/recipes/<id>.json` | GET | **AllowAny** — `404` if hidden or unknown, output masked | — |
| `/games/<slug>/recipes/<id>/full.json` | GET | **GameEdit** — returns even if hidden, adds `hidden`, real output. Always `X-Skip-Cache: true` | — |
| `/games/<slug>/recipes.json` | POST | `IsAuthenticated` + roles per `game_recipe/endpoints.yml` | `regular.create` (staff + player) |
| `/games/<slug>/recipes/<id>.json` | PATCH | `IsAuthenticated` + roles per `game_recipe/endpoints.yml` | `regular.edit` (staff + player) |

No delete endpoint (admin only). No photo upload endpoint.

### Filtering

- `?category=<value>` on `recipes.json` and `recipes/all.json` only, matching the output item's
  `category`.
- An **unknown category value returns an empty list**, not `400`.
- On the plain endpoint, recipes whose output is masked **never match** a category filter (so the
  filter cannot leak a hidden item's category). Unfiltered, they still appear, masked.
- `recipes/all.json` filters on the real category.
- No `?name=` on the game index (matches Common Items).

### Write fields

| Field | Create | Rules |
|-------|--------|-------|
| `name` | required | ≤200 chars; duplicates within a game allowed |
| `game_common_item_id` | required | flat id; must be a `GameCommonItem` of the same game (see E1) |
| `description` | optional | markdown, defaults to `''` |
| `yield_quantity` | optional | integer, `min_value=1`, defaults to `1` |
| `crafting_time` | optional | string, ≤200 chars, defaults to `''` |
| `crafting_cost` | optional | integer, `min_value=0`, defaults to `0` |
| `ingredients` | optional | markdown, defaults to `''` |
| `checks` | optional | markdown, defaults to `''` |
| `hidden` | optional | boolean, defaults to `false` |

PATCH accepts the same fields, all optional. `game` is taken from the URL, never from the body.

- `yield_quantity` and `crafting_cost` are also capped at `2147483647` (the DB integer range);
  larger values return `400`.
- `hidden` is writable on the regular tier, mirroring `GameCommonItem`: any staff member or player
  can hide a recipe. Once hidden, only `GameEdit` callers can see or unhide it (E3).
- `description`, `ingredients` and `checks` are rendered through the existing sanitized markdown
  renderer (no raw HTML), like item and character descriptions.

### Edge cases

- **E1 — hidden output on write:** on the regular tier (caller without `GameEdit`), a
  `game_common_item_id` pointing at a hidden `GameCommonItem` is rejected with the **same `400`**
  as an id from another game or an unknown id, with an identical response body — no existence
  leak. `GameEdit` callers may use a hidden output item.
- **E2 — write response:** the POST / PATCH response follows the caller's **read** tier:
  regular-tier callers get the plain detail shape (output masked to `null` if hidden, no
  `hidden` field); `GameEdit` callers get the `/full.json` shape. `X-Skip-Cache: true`. If a
  regular-tier write leaves the recipe hidden, the response is still `201` / `200` with the plain
  detail shape; subsequent plain reads and regular PATCHes return `404` (E3).
- **E3 — PATCH on a hidden recipe** by a regular-tier caller returns **`404`**, consistent with
  the plain `GET`. `GameEdit` callers can PATCH hidden recipes.

## Common item → recipes

Recipes that produce a given `GameCommonItem`.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/common_items/<common_item_id>/recipes.json` | GET | **AllowAny** — `404` if the common item is hidden or unknown (like `common_items/<id>.json`); excludes hidden recipes |
| `/games/<slug>/common_items/<common_item_id>/recipes/all.json` | GET | **GameEdit** — works even if the common item is hidden; includes hidden recipes, adds `hidden`. Always `X-Skip-Cache: true` |

- Reuses the `game_recipe` read tiers; no `endpoints.yml` keys of its own.
- Same item shape as the game recipe index (output included), so the frontend reuses one list
  component. On the plain endpoint the output is never masked, since the item is visible by
  construction.
- No `?category=` (a single output, nothing to filter).

## Recipe → characters

Characters (PCs and NPCs) who know a recipe. Mirrors `/games/<slug>/factions/<id>/characters.json`.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/recipes/<id>/characters.json` | GET | **AllowAny** — `404` if the recipe is hidden or unknown. Excludes hidden `CharacterRecipe` rows and hidden **or incognito** NPCs. No `X-Skip-Cache` (identical output for every viewer) |
| `/games/<slug>/recipes/<id>/characters/all.json` | GET | **GameEdit** — includes everything (hidden recipe, hidden links, hidden / incognito NPCs), adds `hidden`. Always `X-Skip-Cache: true` |

- `<id>` is the `GameRecipe` id. Entry `id` is the character id (PCs and NPCs share the
  `Character` table).
- Reuses the `game_recipe` read tiers; no `endpoints.yml` keys of its own.
- `/all.json` exposes only `CharacterRecipe.hidden`; there is no separate hidden-NPC marker.
- Paginated, ordered by character `name`, then `id`.

## Character recipes

All routes exist for both `/games/<slug>/pcs/<id>/...` and `/games/<slug>/npcs/<id>/...`.
Configured in `backend/permissions/config/game_pc_recipe/endpoints.yml` and
`backend/permissions/config/game_npc_recipe/endpoints.yml`, like `game_pc_document` /
`game_npc_document`.

On every NPC endpoint the [hidden-NPC gate](../../access-control/character-photo.md#hidden-npc-gate)
applies **before** the permission check (E7): a hidden NPC returns `404` to anyone who cannot view
it, so a hidden NPC is indistinguishable from an unknown one.

### Index and detail

| Endpoint | Method | PC | NPC |
|----------|--------|----|-----|
| `.../recipes.json` | GET | **AllowAny** — non-hidden `CharacterRecipe` rows | **AllowAny** + hidden-NPC gate (sets `X-Skip-Cache: true` when served to an authorized dm/superuser through that gate) |
| `.../recipes/all.json` | GET | **CharacterEdit** — includes hidden, adds `hidden`. `X-Skip-Cache: true` | **GameEdit**, same |
| `.../recipes/<character_recipe_id>.json` | GET | **AllowAny** — `404` if the row is hidden, unknown, or belongs to another character | **AllowAny** + hidden-NPC gate, same `404`s (sets `X-Skip-Cache: true` when served to an authorized dm/superuser through that gate) |
| `.../recipes/<character_recipe_id>/full.json` | GET | **CharacterEdit** — returns even if hidden, adds `hidden`. `X-Skip-Cache: true` | **GameEdit**, same |
| `.../recipes/<character_recipe_id>.json` | PATCH | **CharacterEdit** — `hidden` only | **GameEdit** — `hidden` only |

- `<character_recipe_id>` is the `CharacterRecipe` row id, looked up among **that character's own
  rows** only; an id belonging to another character returns `404`.
- `?name=` (case-insensitive substring on `GameRecipe.name`) on `recipes.json` and
  `recipes/all.json` — the Remove tab searches the character's own list.
- **E9:** `GameRecipe.hidden` is **ignored** on character endpoints: a visible `CharacterRecipe`
  whose `GameRecipe` is hidden is still listed on the plain endpoints. Its `output` is still masked
  (`null`) when the output item is hidden — on plain variants for everyone, and on the PC
  `CharacterEdit` variants for callers without `GameEdit`.
- NPC `incognito` has no effect on these endpoints beyond the `hidden` gate, as for the
  `CharacterDocument` / `CharacterPossession` indexes; `recipes/<id>/characters.json` still
  excludes incognito NPCs.

### Toggling `hidden` (PATCH)

`PATCH /games/<slug>/pcs|npcs/<id>/recipes/<character_recipe_id>.json`:

- Only `hidden` is writable; any other field is ignored.
- Tier: **CharacterEdit** for PCs, **GameEdit** for NPCs — the same callers who can already see
  hidden rows via `/all.json`. On NPCs the hidden-NPC gate runs first.
- Does **not** `404` on a hidden `CharacterRecipe` (unhiding one is the point); still `404` for an
  unknown row or one belonging to another character.
- Response uses the `/full.json` shape. `X-Skip-Cache: true`.
- `401` if unauthenticated, `403` if authenticated without the tier — on NPCs only after the
  hidden-NPC gate has passed.
- **Order:** hidden-NPC gate (NPCs) → authentication / permission check (`401` / `403`) → row
  lookup (`404` for unknown or other-character ids). A non-editor therefore never observes whether
  a given `character_recipe_id` exists.
- On PCs, `CharacterEdit` includes the owning player, so the owner can unhide a `CharacterRecipe`
  that copied `GameRecipe.hidden = true` (same tier as `CharacterItem`, binding per #1443). By E9,
  unhiding **publishes the linked recipe's display fields** (name, description, ingredients,
  checks) on the PC's plain endpoints even though `GameRecipe.hidden` is true. The output item
  stays masked if it is hidden. This is an accepted consequence of the tier.

### Available (acquire catalog)

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `.../recipes/available.json` | GET | **`regular.create`** (staff, player) — the game's recipes minus hidden `GameRecipe`s and recipes the character already knows. `X-Skip-Cache: true` |
| `.../recipes/available/all.json` | GET | **GameEdit** (dm/admin, **no owner leniency**) — includes hidden `GameRecipe`s, still minus already-known ones. Always `X-Skip-Cache: true` (E5) |

- Items use the game recipe index shape (`available` masks the output; `available/all` adds
  `hidden` = `GameRecipe.hidden` and returns the real output).
- `?name=` (case-insensitive substring on `GameRecipe.name`). No `?category=` (E10 dropped).
- Paginated, ordered by `id`.
- Deliberate deviation: unlike sibling `available.json` endpoints (AllowAny), this one is
  `regular.create`-gated, so it sets `X-Skip-Cache: true` and has no Navi resource.
- Known limitation (same as `CharacterDocument`): a recipe known through a hidden
  `CharacterRecipe` is still excluded from `available.json` and still yields `422` on
  `acquire.json`, so a regular-tier caller can infer that a hidden link exists, though not its
  contents.

### Acquire and remove

All four take `{ "game_recipe_id": <id> }` in the POST body.

| Endpoint | Method | PC | NPC | Effect |
|----------|--------|----|-----|--------|
| `.../recipes/acquire.json` | POST | `regular.create` (staff, player) | `regular.create` (staff, player) | Creates a `CharacterRecipe`; `hidden` copied from `GameRecipe.hidden`. `400` if the `GameRecipe` belongs to another game (checked first, regardless of that recipe's `hidden`, so the response never depends on another game's hidden state); `404` if it is unknown or hidden; **`422`** if already known (E4) |
| `.../recipes/acquire/all.json` | POST | **GameEdit** | **GameEdit** | Same, but does not `404` on a hidden `GameRecipe`. No `hidden` override in the body: the new row copies `GameRecipe.hidden`; the GM toggles it afterwards via PATCH |
| `.../recipes/remove.json` | POST | `regular.create` (staff, player) | `regular.create` (staff, player) | Deletes the character's `CharacterRecipe` for that recipe. **`404`** if the character does not know it (E8), or knows it through a hidden row (E6) |
| `.../recipes/remove/all.json` | POST | **CharacterEdit** | **GameEdit** | Same, but does not `404` on a hidden `CharacterRecipe` — the only way to remove one (E6) |

- The `GameRecipe` itself is never touched by remove.
- **E7:** on NPCs the hidden-NPC gate runs before the permission check.
- Success responses: `acquire.json` returns the plain detail shape (no `hidden`, output masked if
  hidden); `acquire/all.json` returns the `/full.json` shape (GameEdit caller, real output). Both
  `201`. Remove returns `204` (mirrors `CharacterDocument`). All set `X-Skip-Cache: true`.
- Catalog visibility (`available/all`, `acquire/all`) is game-level (GameEdit, no owner);
  owned-row visibility (`remove/all`) is character-level (CharacterEdit for PCs) — same split as
  [CharacterDocument](../../access-control/character-document.md#document-acquireremove-endpoints).

## Permissions

### `endpoints.yml` keys

| File | Key | Roles | Used by |
|------|-----|-------|---------|
| `backend/permissions/config/game_recipe/endpoints.yml` | `regular.create` | staff, player | `POST recipes.json`, `can_create_recipe` |
| same | `regular.edit` | staff, player | `PATCH recipes/<id>.json`, `can_edit` on `/permissions/game_recipe.json` |
| `backend/permissions/config/game_pc_recipe/endpoints.yml` | `regular.create` | staff, player | PC `available`, `acquire`, `remove`; `can_exchange_recipe` |
| `backend/permissions/config/game_npc_recipe/endpoints.yml` | `regular.create` | staff, player | NPC `available`, `acquire`, `remove`; `can_exchange_recipe` |

No `regular.photo_upload` key. GameEdit / CharacterEdit tiers are the standard permission classes
and need no `endpoints.yml` key. dm/admin/superuser always bypass via `EndpointPermission`.

### Tier summary

**GameRecipe**

| Endpoint | Tier |
|---|---|
| GET `recipes.json`, `recipes/<id>.json`, `common_items/<id>/recipes.json`, `recipes/<id>/characters.json` | AllowAny (plain) |
| GET `recipes/all.json`, `recipes/<id>/full.json`, `common_items/<id>/recipes/all.json`, `recipes/<id>/characters/all.json` | GameEdit, `X-Skip-Cache: true` |
| POST `recipes.json` | `regular.create` (staff + player) |
| PATCH `recipes/<id>.json` | `regular.edit` (staff + player) |

**CharacterRecipe**

| Endpoint | PC | NPC |
|---|---|---|
| `recipes.json`, `recipes/<character_recipe_id>.json` | AllowAny | AllowAny + hidden-NPC gate |
| `recipes/all.json`, `recipes/<character_recipe_id>/full.json` | CharacterEdit | GameEdit |
| `recipes/available.json`, `recipes/acquire.json`, `recipes/remove.json` | `regular.create` (staff, player) | `regular.create` (staff, player) |
| `recipes/available/all.json`, `recipes/acquire/all.json` | GameEdit | GameEdit |
| `recipes/remove/all.json` | CharacterEdit | GameEdit |
| PATCH `recipes/<character_recipe_id>.json` (`hidden` only) | CharacterEdit | GameEdit |

### Permission endpoints and flags

| Endpoint / flag | Who can call | Shape |
|---|---|---|
| `can_create_recipe` on `GET /permissions/game.json` | AllowAny | roles from `game_recipe` `regular.create`; same real-identity vs. role-simulated dual path as `can_create_common_item` |
| `GET /permissions/game_recipe.json` | AllowAny | entity-agnostic, role-simulated `can_edit` from `regular.edit` (mirrors `/permissions/game_common_item.json`) |
| `can_exchange_recipe` on `GET /permissions/game_pc.json` / `game_npc.json` | AllowAny | roles from `game_pc_recipe` / `game_npc_recipe` `regular.create`; gates the frontend acquire/remove ("exchange") trigger. Follows `can_create_possession` / `can_exchange_treasure` |

`CharacterDocument` has no equivalent flag today; tracked separately in #1453.

## Shortlists and Navi

Shortlists reuse the plain index with `?per_page=5` — no new endpoints. Editors get the
`/all.json?per_page=5` variant through the frontend resolver.

| Page | Shortlist URL | Navi resource (plain URL only) |
|---|---|---|
| PC / NPC detail — Recipes | `/games/<slug>/pcs\|npcs/<id>/recipes.json?per_page=5` | `short_pc_recipes` / `short_npc_recipes`, chained from `pc` / `npc` |
| Recipe detail — Known by | `/games/<slug>/recipes/<id>/characters.json?per_page=5` | `short_recipe_characters`, chained from the recipe resource |
| Common item detail — Recipes that produce it | `/games/<slug>/common_items/<id>/recipes.json?per_page=5` | `short_common_item_recipes`, chained from the common item resource |

Navi need per endpoint (contents are #1448's job):

| Endpoint | Navi resource |
|---|---|
| `/games/<slug>/recipes.json` | yes (paginated) |
| `/games/<slug>/recipes/<id>.json` | yes, chained from the recipe index |
| `/games/<slug>/common_items/<id>/recipes.json` | yes (paginated) + shortlist |
| `/games/<slug>/recipes/<id>/characters.json` | yes (paginated) + shortlist |
| `/games/<slug>/pcs\|npcs/<id>/recipes.json` | yes (paginated) + shortlist |
| `/games/<slug>/pcs\|npcs/<id>/recipes/<character_recipe_id>.json` | yes, chained from the character recipe index |
| `/permissions/game_recipe.json` | yes, with the same `?role=` variants as the other entries in `navi/resources/permissions.yml` |
| Every `/all.json`, `/full.json`, `available*`, write endpoint | no |

`available.json` is not warmed: it is authenticated-only (`regular.create`) and per-character.
