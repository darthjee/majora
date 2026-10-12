# Plan: Game content copy: Recipes tab

Issue: [1574-game-content-copy-recipes-tab.md](../../issues/1574-game-content-copy-recipes-tab.md)

## Overview
Add the `recipes` copy type to the staff copies API (list + copy) on top of the existing
`ModelCopyType` foundation, resolving each recipe's required `GameCommonItem` in the target game
(reuse the newest direct copy, else copy it via `CommonItemsCopyType.copy_instance` in the same
transaction), and add the Recipes tab row component with its i18n keys. Source of truth:
`docs/agents/specs/game-content-copy/recipes.md`.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

Reviews after implementation: `data-access`, `security` (new list fields, new copy endpoint);
`cache` confirms the `X-Cache-Clear` paths and that no Navi resource is needed (`staff/copies`
is never warmed).

## Shared contracts

### `GET /staff/copies/recipes.json?from=<slug>&to=<slug>`
Paginated (standard paginator headers), ordered by `id`, every recipe of the source game
(hidden included). Row:

```json
{
  "id": 12,
  "name": "Healing Potion Recipe",
  "hidden": false,
  "yield_quantity": 2,
  "crafting_cost": 30,
  "common_item": {"id": 7, "name": "Healing Potion", "copied_to_target": true},
  "copied_to_target": false
}
```

- `common_item.copied_to_target` (bool): the target holds a `GameCommonItem` whose `copied_from`
  is this common item (it will be reused).
- `copied_to_target` (bool): the target holds a recipe whose `copied_from` is this recipe.
- `copied_from` is never exposed.

### `POST /staff/copies/recipes/<id>.json` `{"target": "<slug>"}`
Global copy responses; `201 {"id": <new recipe id>, "links": [...]}` with 0 or 1 link (the
dependency common item's cover, only when the common item was copied and its cover is ready).

### Registry
`recipes` is registered in `COPY_TYPES` right after `common_items`
(`GET /staff/copies.json` → `types[:3] == ['items', 'common_items', 'recipes']`).

### i18n keys (namespace `staff_copies_page`, en + pt)
- `common_item_column` — header of the common item column (en: "Common item").
- `common_item_reused` — indicator when `common_item.copied_to_target` (en: "Reused").
- `common_item_will_copy` — indicator otherwise (en: "Will be copied").
