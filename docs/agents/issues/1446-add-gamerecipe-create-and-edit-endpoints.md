# Issue: Add GameRecipe create and edit endpoints

## Description

Part of #1441 (crafting recipes). The `GameRecipe` model and its read endpoints already exist.
This issue adds the **write** API (create and edit) for `GameRecipe`, as defined in
[`docs/agents/specs/recipes/api-contract.md`](../specs/recipes/api-contract.md#game-recipes).

Recipes have **no photo and no uploads of any kind** (decided in #1443), so there is no
photo-upload endpoint and no `regular.photo_upload` permission key.

Parent: #1441

## Problem

Recipes can be read but not created or edited through the API. Staff and players have no way to
add a recipe to a game or change an existing one. The frontend also has no permission flags to
decide whether to show create/edit controls.

## Expected Behavior

### Endpoints

| Endpoint | Method | Who can call | `endpoints.yml` key |
|----------|--------|-------------|---------------------|
| `/games/<slug>/recipes.json` | POST | `IsAuthenticated` + roles per `game_recipe/endpoints.yml` | `regular.create` (staff + player) |
| `/games/<slug>/recipes/<id>.json` | PATCH | `IsAuthenticated` + roles per `game_recipe/endpoints.yml` | `regular.edit` (staff + player) |

dm/admin/superuser always bypass via `EndpointPermission`. `401` when unauthenticated, `403` when
authenticated without the role. Both endpoints always set `X-Skip-Cache: true`.

### Write fields (explicit allowlist)

| Field | Create | Rules |
|-------|--------|-------|
| `name` | required | ≤200 chars; duplicates within a game allowed |
| `game_common_item_id` | required | flat integer id; must be a `GameCommonItem` of the same game |
| `description` | optional | markdown, defaults to `''` |
| `yield_quantity` | optional | integer, min 1, max 2147483647, defaults to `1` |
| `crafting_time` | optional | string, ≤200 chars, defaults to `''` |
| `crafting_cost` | optional | integer, min 0, max 2147483647, defaults to `0` |
| `ingredients` | optional | markdown, defaults to `''` |
| `checks` | optional | markdown, defaults to `''` |
| `hidden` | optional | boolean, defaults to `false`; writable on the regular tier |

- PATCH accepts the same fields, all optional.
- `game` comes from the URL, never from the body. `id`, `game` and any unlisted field have no
  effect (mass assignment). Add a regression test for this.
- `game_common_item_id` that is missing (on create) or not an integer returns `400`, never `404`
  or `500`.

### Validation and visibility

- **E1, hidden output on write:** `game_common_item_id` must belong to the same game on both
  create and update. On the regular tier (caller without `GameEdit`), an id pointing at a
  **hidden** `GameCommonItem` is rejected with the **same `400` and identical body** as an
  unknown id or an id from another game (no existence leak). `GameEdit` callers may use a hidden
  output item.
- **E2, write response:** the POST (`201`) / PATCH (`200`) response follows the caller's read
  tier:
  - regular-tier callers get the plain detail shape: no `hidden` field, and `output` is `null`
    when the output item is hidden;
  - `GameEdit` callers get the `/full.json` shape (with `hidden` and the real `output`).
  - If a regular-tier write leaves the recipe hidden, the response is still `201` / `200` with
    the plain shape. After that, plain reads and regular-tier PATCHes return `404`.
- **E3, PATCH on a hidden recipe** by a regular-tier caller returns `404`, the same as the plain
  `GET`. `GameEdit` callers can PATCH hidden recipes.
- An unknown recipe id, or one from another game, returns `404` on PATCH.

### Permission flags

- `can_create_recipe` on `GET /permissions/game.json`, from `game_recipe` `regular.create`. It
  uses the same real-identity vs. role-simulated dual path as `can_create_common_item`.
- New `GET /permissions/game_recipe.json` (AllowAny): an entity-agnostic, role-simulated
  `can_edit` from `regular.edit`. It mirrors `/permissions/game_common_item.json`.

## Solution

Backend only:

- Add `backend/permissions/config/game_recipe/endpoints.yml` with `regular.create` and
  `regular.edit` for staff + player. Copy `game_common_item/endpoints.yml` without
  `photo_upload`.
- Add POST/PATCH handling to the existing recipe routes, with a write serializer that uses an
  explicit field allowlist and the validation above. Pick the response serializer from the
  caller's tier (plain detail vs. full).
- Add `can_create_recipe` to the game permissions endpoint, and add the
  `/permissions/game_recipe.json` endpoint.
- Update `docs/agents/access-control/game-recipe.md` with the write endpoints, the permission
  flags and E1–E3.
- Tests: role matrix (anonymous / non-member / player / staff / dm / admin / superuser) for both
  endpoints; field defaults and bounds; cross-game, unknown and hidden `game_common_item_id` on
  both tiers (same `400` body); response shape per tier; PATCH on a hidden recipe on both tiers;
  `X-Skip-Cache`; mass-assignment regression; permission flags.

### Out of scope

- `CharacterRecipe` endpoints, Navi resources (including `/permissions/game_recipe.json`, #1448)
  and the frontend.
- No delete endpoint (admin only). No photo upload.

## Benefits

- Staff and players can build a game's recipe catalog through the API.
- The frontend gets the flags it needs to show recipe create/edit controls.
- Write-path masking matches the read-path rules, so hidden common items and hidden recipes don't
  leak through writes.
