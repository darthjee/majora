# Issue: Recipes spec (2/3): API contract

## Description
Part of #1441 (crafting recipes). This is the second of three spec phases. It comes after the
domain spec (#1442: `docs/agents/specs/recipes.md` → `recipes/game-recipe.md`,
`character-recipe.md`, `visibility.md`, `deletion.md`, `permissions.md`) and before the frontend
design (#1444). It defines the API contract that every backend, cache and frontend sub-issue
(#1445–#1450) implements against.

Docs only: no code changes.

## Problem
The domain spec fixes the entities and rules, but leaves the API shape open: routes, permission
tiers, request/response fields per variant, error codes, caching and pagination. Several gaps
would otherwise be re-decided, inconsistently, by each implementation issue:
- no way to toggle `CharacterRecipe.hidden`, although `visibility.md` promises the GM can;
- `<recipe_id>` in character routes is ambiguous;
- missing `available/all.json` / `remove/all.json` variants;
- no shape for the mixed PC/NPC "Known by" list;
- no character-level UI flag for acquire/remove.

## Expected Behavior
- `docs/agents/specs/recipes/api-contract.md` exists and is linked from `docs/agents/specs/recipes.md`
  (dropping its "pending" marker).
- For every endpoint it lists: route, method, permission tier and `endpoints.yml` key, request
  fields, response fields per variant (plain / `all` / `full`), error codes, `X-Skip-Cache`
  behavior, and whether a Navi resource is needed.
- It reflects every decision in the Solution below.
- Domain pages that contradict it are corrected in the same change: `recipes/game-recipe.md`
  and `recipes/permissions.md` still describe the recipe photo.
- The **data-access** and **security** agents reviewed the written contract, and their findings
  are addressed.

## Solution

### Endpoints to cover
Shapes follow `docs/agents/access-control/game-common-item.md`, `character-possession.md`,
`character-document.md` and `faction.md`.

- **Game recipes:** `/games/<slug>/recipes.json` (GET plain with `?category=`; POST create),
  `/recipes/all.json` (GameEdit, real-category filter), `/recipes/<id>.json` (GET plain, 404 if
  hidden; PATCH), `/recipes/<id>/full.json`. **No photo upload.**
- **Common item → recipes:** `/games/<slug>/common_items/<id>/recipes.json` + `/recipes/all.json`.
- **Recipe → characters:** `/games/<slug>/recipes/<id>/characters.json` + `/characters/all.json`.
- **Character recipes** (`/games/<slug>/pcs|npcs/<id>/...`):
  - `recipes.json`, `recipes/all.json`
  - `recipes/<character_recipe_id>.json` (GET; PATCH `hidden`), `recipes/<character_recipe_id>/full.json`
  - `recipes/available.json`, `recipes/available/all.json`
  - `recipes/acquire.json`, `recipes/acquire/all.json`
  - `recipes/remove.json`, `recipes/remove/all.json`
- **Permissions:** `can_create_recipe` on `GET /permissions/game.json`,
  `/permissions/game_recipe.json`, and `can_exchange_recipe` on `/permissions/game_pc.json` /
  `game_npc.json`.

The decisions below were settled during the enhancement pass and are binding for the contract.

### Scope boundaries

**In scope** — the contract fixes, for every endpoint:
- Route, method, permission tier and `endpoints.yml` key.
- Request fields, response fields per variant (plain / `all` / `full`) and error codes (`400` / `403` / `404`).
- `X-Skip-Cache` behavior and whether a Navi resource is needed (yes/no only).
- Permission flags: `can_create_recipe` on `GET /permissions/game.json`,
  `/permissions/game_recipe.json`, and any character-level flag.
- Linking the page from `docs/agents/specs/recipes.md` (dropping its "pending" marker), plus
  the data-access / security review and addressing its findings.
- API-shape gaps left open by the domain spec (#1442) — e.g. toggling `CharacterRecipe.hidden`,
  the meaning of `<recipe_id>` in character routes — are **resolved in the contract**. If a
  resolution contradicts a domain page (e.g. `visibility.md`), that page is corrected in the same
  change so the spec stays consistent.

**Out of scope**
- Any code: models, serializers, views, `endpoints.yml` files (#1445–#1447). The contract
  does not name serializer/view classes.
- Navi resource file contents (#1448) — the contract only says which endpoints need one.
- Frontend placement and resolver wiring (#1444).
- Updating `docs/agents/access-control/` and `docs/agents/product/entities/` (#1451 moves the
  knowledge there).
- Re-deciding domain rules from #1442 (fields, visibility, deletion).

### Edge cases

The contract must state these explicitly (decided while enhancing this issue):

**GameRecipe writes**
- **E1 — hidden output on create/PATCH:** on the regular tier, a hidden `game_common_item` is
  rejected with the same `400` as "not in this game" (no existence leak); `GameEdit` callers may
  use a hidden output item.
- **E2 — write response:** the create/PATCH response follows the caller's read tier — output
  masked (`null`) for regular callers, full for `GameEdit`.
- **E3 — PATCH on a hidden recipe** by a regular-tier caller → `404`, consistent with plain `GET`.

**CharacterRecipe**
- **E4 — duplicate acquire → `422`** (sibling convention, `CharacterDocument` /
  `CharacterPossession`); cross-game link stays `400`.
- **E5 — add `/recipes/available/all.json`** (`GameEdit`, no owner leniency, includes hidden
  recipes, `X-Skip-Cache: true`) — needed for the GM's `acquire/all` picker.
- **E6 — add `/recipes/remove/all.json`** (PCs: `CharacterEdit`; NPCs: `GameEdit`) — the only way
  to remove a hidden `CharacterRecipe`; the regular `remove` `404`s on it.
- **E7 — hidden NPC:** available / acquire / remove apply the hidden-NPC gate before the
  permission check (`404`), as sibling sub-resources do.
- **E8 — removing a recipe the character does not know → `404`.**

**Masking interplay**
- **E9 — visible `CharacterRecipe` whose `GameRecipe` is hidden:** still listed on the character's
  plain endpoints (`GameRecipe.hidden` is ignored there), but its output is still masked when the
  output item is hidden.
- **E10 — dropped:** `?category=` is not offered on `available.json` (see index conventions).

### Permissions

The contract uses these tiers (decided while enhancing this issue):

**GameRecipe** — `backend/permissions/config/game_recipe/endpoints.yml` (same location as
`game_common_item`)

| Endpoint | Tier |
|---|---|
| GET `recipes.json`, `recipes/<id>.json`, `common_items/<id>/recipes.json`, `recipes/<id>/characters.json` | AllowAny (plain) |
| GET `recipes/all.json`, `recipes/<id>/full.json`, `common_items/<id>/recipes/all.json`, `recipes/<id>/characters/all.json` | GameEdit, `X-Skip-Cache: true` |
| POST `recipes.json` | `regular.create` (staff + player) |
| PATCH `recipes/<id>.json` | `regular.edit` (staff + player) |
| GET `/permissions/game_recipe.json` | AllowAny, role-simulated `can_edit` (mirrors `game_common_item`) |
| `can_create_recipe` on `GET /permissions/game.json` | roles from `regular.create` |

The common-item → recipes and recipe → characters listings reuse the `game_recipe` read tiers;
they get no `endpoints.yml` keys of their own.

**CharacterRecipe** — `game_pc_recipe` / `game_npc_recipe/endpoints.yml`

| Endpoint | PC | NPC |
|---|---|---|
| `recipes.json`, `recipes/<id>.json` | AllowAny | AllowAny + hidden-NPC gate |
| `recipes/all.json`, `recipes/<id>/full.json` | CharacterEdit | GameEdit |
| `recipes/available.json`, `recipes/acquire.json`, `recipes/remove.json` | `regular.create` (staff, player) | `regular.create` (staff, player) |
| `recipes/available/all.json`, `recipes/acquire/all.json` | GameEdit | GameEdit |
| `recipes/remove/all.json` | CharacterEdit | GameEdit |
| PATCH `recipes/<character_recipe_id>.json` (`hidden` only) | CharacterEdit | GameEdit |

**Character-level UI flag:** add `can_exchange_recipe` to `GET /permissions/game_pc.json` and
`/permissions/game_npc.json`, with roles from `regular.create` in the matching endpoints file. It
follows the `can_create_possession` / `can_exchange_treasure` precedent and gates the frontend
acquire/remove ("exchange") trigger. `CharacterDocument` has no such flag today; that is tracked
separately in #1453.

### Character-route identifiers

Mirrors `CharacterPossession` / `CharacterDocument`:

- **Detail routes** are `/pcs|npcs/<id>/recipes/<character_recipe_id>.json` (+ `/full.json`). The
  parameter is the `CharacterRecipe` row id, looked up among that character's own rows, so an id
  belonging to another character returns `404`. The contract names the parameter
  `<character_recipe_id>` (instead of the issue's ambiguous `<recipe_id>`).
- **Response fields:** `id` (the `CharacterRecipe` row), `game_recipe_id`, then the display fields
  sourced from the linked `GameRecipe`.
- **`acquire.json` / `acquire/all.json` / `remove.json` / `remove/all.json`** take
  `{ "game_recipe_id": <id> }` in the POST body.
- **`/recipes/<id>/characters.json`** is the reverse direction: `<id>` is the `GameRecipe` id, and
  entries carry the character's id (exact shape under "Recipe → characters response").

### Toggling `CharacterRecipe.hidden`

Follows the `CharacterItem` precedent, kept minimal:

- **`PATCH /games/<slug>/pcs|npcs/<id>/recipes/<character_recipe_id>.json`**, with **only `hidden`**
  writable.
- Tier: CharacterEdit for PCs, GameEdit for NPCs (the same callers who can already see hidden rows
  via `/all.json`). On NPCs the hidden-NPC gate is applied before the permission check.
- It does not `404` on a hidden `CharacterRecipe`, since unhiding one is the point.
- The response uses the `/full.json` shape.
- `acquire/all.json` does **not** accept a `hidden` override: new links copy `GameRecipe.hidden`
  (per `visibility.md`), and the GM toggles afterwards.

### Common item → recipes when the item is hidden

- Plain `GET /games/<slug>/common_items/<id>/recipes.json` returns **`404`** when the common item
  is hidden or unknown, like `common_items/<id>.json`. So on this endpoint the output is never
  masked: the item is visible by construction. Hidden recipes are still excluded.
- `GET .../common_items/<id>/recipes/all.json` (GameEdit) works even when the item is hidden. It
  includes hidden recipes and exposes `hidden`, and sets `X-Skip-Cache: true`.
- Both keep the same item shape as the game recipe index (output included), so the frontend can
  reuse one list component.

### Recipe → characters response

Mirrors `/games/<slug>/factions/<id>/characters.json`:

- **Plain `GET .../recipes/<id>/characters.json`** (AllowAny): paginated
  `{id, name, photo_path, type}`. `id` is the **character** id (PCs and NPCs share the `Character`
  table), and `type` is `'pc'` or `'npc'`. It returns `404` if the recipe is hidden, and excludes
  hidden `CharacterRecipe` rows and hidden or incognito NPCs. No `X-Skip-Cache`, since the output
  is the same for every viewer.
- **`.../characters/all.json`** (GameEdit): includes everything and adds `hidden`
  (= `CharacterRecipe.hidden`). There is no separate hidden-NPC marker. Always `X-Skip-Cache: true`.
- **Order:** character `name`, then `id` as a tiebreak.
- Entries carry no `character_recipe_id`: toggling and removing happen from the character page.

### Index conventions

- **Pagination:** every index endpoint uses standard pagination (`paginated_list_response`).
  That covers game, common-item, character, `available` and `characters` listings.
- **Order:** by `id`, except `recipes/<id>/characters.json`, which orders by character name then
  `id` (see above).
- **`?category=`** only on the game `recipes.json` and `recipes/all.json`. It is not offered on
  `common_items/<id>/recipes.json` (a single output, so nothing to filter), nor on character lists
  or `available` (so E10 does not apply). An **unknown category value returns an empty list**, not
  `400`. On the plain endpoint, masked recipes never match.
- **`?name=`** (case-insensitive substring on `GameRecipe.name`) on `recipes/available.json`,
  `recipes/available/all.json` (acquire catalogs), **and** on the character lists
  `pcs|npcs/<id>/recipes.json` + `/all.json`: the Remove tab searches the character's own list,
  as `RemoveDocumentTabController.js` does for documents. The game
  index has no name search, matching Common Items.

### Response shape

- **Index item:** `id`, `name`, `yield_quantity`, `crafting_time`, `crafting_cost`,
  `output`. `/all.json` adds `hidden`.
- **Detail** adds `description`, `ingredients`, `checks`. `/full.json` adds `hidden`.
- **`output` is a nested object:** `{id, name, photo_path, category}`, or `null` when masked. The
  mask is a single field, so adding output fields later can never leak partially.
- **Character recipe entry:** `id` (the `CharacterRecipe` row), `game_recipe_id`, then the same
  fields as the recipe index item (including the nested, maskable `output`). The `/all.json` and
  `/full.json` `hidden` is `CharacterRecipe.hidden`.
- **Write side:** create and PATCH take a flat `game_common_item_id`.

Example index entry (visible / masked):

```json
{ "id": 12, "name": "Brew Healing Potion",
  "yield_quantity": 2, "crafting_time": "8 hours", "crafting_cost": 50,
  "output": { "id": 7, "name": "Healing Potion", "photo_path": "/uploads/.../7/photo.png", "category": "potion" } }

{ "id": 13, "name": "Mysterious Distillation",
  "yield_quantity": 1, "crafting_time": "", "crafting_cost": 120, "output": null }
```

### Shortlists

Shortlists reuse the plain index with `?per_page=5` (no new endpoints), like the existing
character sections. Editors get the `/all.json?per_page=5` variant through the resolver.

| Page | Shortlist URL | Navi resource (plain URL only) |
|---|---|---|
| PC / NPC detail — Recipes | `/games/<slug>/pcs\|npcs/<id>/recipes.json?per_page=5` | `short_pc_recipes` / `short_npc_recipes`, chained from `pc` / `npc` |
| Recipe detail — Known by | `/games/<slug>/recipes/<id>/characters.json?per_page=5` | `short_recipe_characters`, chained from the recipe resource |
| Common item detail — Recipes that produce it | `/games/<slug>/common_items/<id>/recipes.json?per_page=5` | `short_common_item_recipes`, chained from the common item resource |

Where these sections go on each page is #1444's job. The contract fixes the `per_page` and
the Navi need.

### No recipe photo

Decided while enhancing: recipes have **no uploads of any kind**, including no photo.

- Drop `POST recipes/<id>/photo_upload.json`, the `regular.photo_upload` key and the
  `GameRecipePhoto` model.
- Drop the recipe's own `photo_path` from every response (index, detail, character recipe
  entries). **Keep `output.photo_path`**, the output common item's own existing photo.
- `recipes/<id>/characters.json` is unaffected, since it carries *character* photos.
- `description`, `ingredients` and `checks` stay markdown: edited with the same editor as item and
  character descriptions on new/edit, and rendered as markdown on show. No change from the domain
  spec.
- Correct the domain pages in the same change: `recipes/game-recipe.md` (the `photo` row and the
  `GameRecipe 1 — 1 GameRecipePhoto` relationship) and `recipes/permissions.md` (photo upload).
- The permissions table, response shape and examples above already reflect this.

## Benefits
- A single, reviewed source of truth for #1445–#1450, so backend, Navi and frontend agree on
  routes, tiers and payloads before any code is written.
- Access-control and security decisions (masking, hidden gates, `X-Skip-Cache`) get reviewed once,
  up front, instead of per implementation PR.
