# GameRecipe

**[Game resource](principles.md#resource-categories).** A `GameRecipe` is a game-level crafting
recipe that produces exactly one [GameCommonItem](game-common-item.md) (its `game_common_item`,
the recipe's "output"), with its own `name`, `description`, `yield_quantity`, `crafting_time`,
`crafting_cost`, free-text `ingredients` / `checks`, and a `hidden` flag scoping visibility within
the game (issue #1445). Recipes have **no photo and no uploads of any kind**; the only image shown
for a recipe is its output common item's own photo (`output.photo_path`). No dedicated delete
endpoint (Django-admin-only for superusers); deleting the output `GameCommonItem` cascades to its
recipes.

Follows the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern): plain endpoints exclude hidden
recipes and never expose `hidden`; `/all.json` and `/full.json` include them and expose `hidden`.

Writes (issue #1446) use the broader **Regular** tier: `IsAuthenticated` plus the roles in
[`game_recipe/endpoints.yml`](../../../backend/permissions/config/game_recipe/endpoints.yml)
(`create` / `edit`: staff + player). dm/admin/superuser always pass via the `EndpointPermission`
shortcut. Unauthenticated callers get `401`, authenticated callers without a role get `403`.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/recipes.json` | GET | **AllowAny** — non-hidden recipes, output masked. Supports `?category=` |
| `/games/<slug>/recipes/all.json` | GET | **GameEdit** — includes hidden, adds `hidden`, real output. Supports `?category=`. Always `X-Skip-Cache: true` |
| `/games/<slug>/recipes/<id>.json` | GET | **AllowAny** — 404 if hidden, unknown or in another game; output masked |
| `/games/<slug>/recipes/<id>/full.json` | GET | **GameEdit** — returns even if hidden, adds `hidden`, real output. Always `X-Skip-Cache: true` |
| `/games/<slug>/common_items/<common_item_id>/recipes.json` | GET | **AllowAny** — 404 if the common item is hidden or unknown; excludes hidden recipes |
| `/games/<slug>/common_items/<common_item_id>/recipes/all.json` | GET | **GameEdit** — works even if the common item is hidden; includes hidden recipes, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/recipes/<id>/characters.json` | GET | **AllowAny** — 404 if the recipe is hidden, unknown or in another game; excludes hidden `CharacterRecipe` links and hidden or incognito NPCs |
| `/games/<slug>/recipes/<id>/characters/all.json` | GET | **GameEdit** — works even if the recipe is hidden; includes hidden links and hidden / incognito NPCs, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/recipes.json` | POST | roles per [`game_recipe/endpoints.yml`](../../../backend/permissions/config/game_recipe/endpoints.yml) (`create`: staff + player). Always `X-Skip-Cache: true` |
| `/games/<slug>/recipes/<id>.json` | PATCH | roles per [`game_recipe/endpoints.yml`](../../../backend/permissions/config/game_recipe/endpoints.yml) (`edit`: staff + player). 404 on a hidden recipe for regular-tier callers. Always `X-Skip-Cache: true` |
| `/permissions/game_recipe.json` | GET | **AllowAny** — entity-agnostic, role-simulated `can_edit` (mirrors `permissions/game_common_item.json`) |

Plain GET endpoints set no `X-Skip-Cache`. Every index endpoint is paginated
(`?page=` / `?per_page=`) and ordered by `id`, except the recipe → characters endpoints below.

## Recipe → characters

`recipes/<id>/characters.json` (+ `/all.json`) list the characters (PCs and NPCs) who know the
recipe through a [CharacterRecipe](character-recipe.md), mirroring
`factions/<id>/characters.json`. They reuse the `game_recipe` read tiers and add no
`endpoints.yml` keys. Entries are `id` (the **character** id), `name`, `photo_path` (the
character's) and `type` (`'pc'` / `'npc'`); `/all.json` adds `hidden` (the
`CharacterRecipe.hidden` value). Ordered by character `name`, then `id`, and paginated.

## Fields

List: `id`, `name`, `yield_quantity`, `crafting_time`, `crafting_cost`, `output`. Detail adds
`description`, `ingredients` and `checks` (markdown text, detail endpoints only).
`/all.json` / `/full.json` add `hidden`.

`output` is the output common item embedded as `{ id, name, photo_path, category }` — see
[Photo path fields](common-rules.md#photo-path-fields).

## Output masking

When a recipe's output `GameCommonItem` is hidden, the plain (non-restricted) endpoints return
`output: null` — the **whole object** is masked, never individual fields, so no id, name, photo or
category leaks and adding output fields later can never leak partially. The restricted variants
(`recipes/all.json`, `recipes/<id>/full.json`, `common_items/<id>/recipes/all.json`) return the
real output to `GameEdit` callers.

On `common_items/<common_item_id>/recipes.json` the output is never masked in practice: a hidden
common item already returns 404 there, so the output is visible by construction.

## Category filter

`?category=<value>` on `recipes.json` and `recipes/all.json` only, matched by exact equality
against the output item's `GameCommonItem.category` choices:

- An **unknown value returns an empty list**, not `400` (unlike `tasks.json`, which ignores an
  unknown value).
- On the plain endpoint, recipes whose output is masked **never match** a category filter, so the
  filter cannot leak a hidden item's category ([filter-visibility
  rule](principles.md#filter-visibility-rule)). Unfiltered, they still appear, masked.
- `recipes/all.json` filters on the real category, hidden outputs included.
- The common-item → recipes endpoints ignore `?category=` (a single output, nothing to filter).

## Write endpoints

`POST /games/<slug>/recipes.json` creates a recipe (`201`); `PATCH
/games/<slug>/recipes/<id>.json` partially updates one (`200`). Both always set
`X-Skip-Cache: true`, on every status (`2xx`, `400`, `401`, `403`, `404`), including the `404`
for an unknown game slug, which is checked before authentication. There is no photo upload and no
delete endpoint.

Write fields (explicit allowlist, `GameRecipeWriteSerializer`):

| Field | Create | Rules |
|-------|--------|-------|
| `name` | required | ≤200 chars; duplicates within a game allowed |
| `game_common_item_id` | required | flat integer id of a `GameCommonItem` of the same game |
| `description` | optional | markdown, defaults to `''` |
| `yield_quantity` | optional | integer, 1..2147483647, defaults to `1` |
| `crafting_time` | optional | string, ≤200 chars, defaults to `''` |
| `crafting_cost` | optional | integer, 0..2147483647, defaults to `0` |
| `ingredients` | optional | markdown, defaults to `''` |
| `checks` | optional | markdown, defaults to `''` |
| `hidden` | optional | boolean, defaults to `false`; writable on the regular tier |

`PATCH` accepts the same fields, all optional. `game` comes from the URL; `id`, `game` and any
unlisted field in the body are ignored (no mass assignment). A missing (on create) or
non-integer `game_common_item_id` returns `400` (`required` / `incorrect_type`), never `404` or
`500`.

The caller's tier is **GameEdit** (dm/superuser, `game.can_be_edited_by`) or **regular**
(everyone else who passed the role check):

- **E1, output validation.** `game_common_item_id` must belong to the same game, on create and
  update. On the regular tier a **hidden** output item is rejected with the same `400` and
  identical body as an unknown or other-game id —
  `{"errors": {"game_common_item_id": ["does_not_exist"]}}` — so writes never reveal that a
  hidden item exists. GameEdit callers may use a hidden output item.
- **E2, response shape.** Regular-tier callers get the plain detail shape (no `hidden`, `output`
  masked as `null` when the output item is hidden). GameEdit callers get the `/full.json` shape
  (with `hidden` and the real `output`). A regular-tier write that leaves the recipe hidden still
  returns `201` / `200` with the plain shape; afterwards plain reads and regular-tier `PATCH`es
  return `404`.
- **E3, PATCH on a hidden recipe.** Regular-tier callers get `404`, the same as the plain `GET`.
  GameEdit callers can `PATCH` hidden recipes. An unknown recipe id, or one from another game,
  returns `404` on either tier.

## Permission flags

- `can_create_recipe` on [`GET /permissions/game.json`](game.md), roles from
  [`game/ui.yml`](../../../backend/permissions/config/game/ui.yml) (`create_recipe`: staff +
  player), kept in sync with `game_recipe/endpoints.yml` `regular.create`.
- `can_edit` on `GET /permissions/game_recipe.json` (AllowAny), entity-agnostic and
  role-simulated, roles from
  [`game_recipe/ui.yml`](../../../backend/permissions/config/game_recipe/ui.yml) (`edit`: staff +
  player), mirroring `regular.edit`.
