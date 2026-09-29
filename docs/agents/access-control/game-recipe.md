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

This page covers the read endpoints only. The write endpoints (`POST recipes.json`,
`PATCH recipes/<id>.json`), `game_recipe/endpoints.yml` and the permission flags are added by
#1446.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/recipes.json` | GET | **AllowAny** — non-hidden recipes, output masked. Supports `?category=` |
| `/games/<slug>/recipes/all.json` | GET | **GameEdit** — includes hidden, adds `hidden`, real output. Supports `?category=`. Always `X-Skip-Cache: true` |
| `/games/<slug>/recipes/<id>.json` | GET | **AllowAny** — 404 if hidden, unknown or in another game; output masked |
| `/games/<slug>/recipes/<id>/full.json` | GET | **GameEdit** — returns even if hidden, adds `hidden`, real output. Always `X-Skip-Cache: true` |
| `/games/<slug>/common_items/<common_item_id>/recipes.json` | GET | **AllowAny** — 404 if the common item is hidden or unknown; excludes hidden recipes |
| `/games/<slug>/common_items/<common_item_id>/recipes/all.json` | GET | **GameEdit** — works even if the common item is hidden; includes hidden recipes, adds `hidden`. Always `X-Skip-Cache: true` |

Plain endpoints set no `X-Skip-Cache`. Every index endpoint is paginated
(`?page=` / `?per_page=`) and ordered by `id`.

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
