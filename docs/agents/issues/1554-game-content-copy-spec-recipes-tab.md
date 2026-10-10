# Issue: Game content copy spec: Recipes tab

## Description
Part of the "copy content between games" epic (#1550). Write the tab spec page
`docs/agents/specs/game-content-copy/recipes.md` for the **Recipes** tab (`GameRecipe`). It must
reference the global pages (`page.md`, `copy-flow.md`, `hard-links.md`, `permissions.md`) and
only add what is specific to recipes, following the structure of `items.md` and
`common-items.md`. Docs only: no code changes.

## Problem
`GameRecipe` is the only copyable model with a required in-game FK (`game_common_item`,
`CASCADE`), and a copy never references a row of another game
([copy-flow.md](../specs/game-content-copy/copy-flow.md#same-game-references)). The spec must define how that
dependency is resolved in the target game, alongside the usual per-tab sections.

## Expected Behavior
`recipes.md` exists, is linked from `docs/agents/specs/game-content-copy.md` (Tab pages), and covers:

- **Model** — tab slug `recipes`, label "Recipes", `GameRecipe` fields; recipes have no photos.
- **Copied fields** — `name`, `description`, `yield_quantity`, `crafting_time`,
  `crafting_cost`, `ingredients`, `checks` from the source; `hidden` kept; `game` = target;
  `copied_from` = source; `game_common_item` resolved as below.
- **Not copied** — `CharacterRecipe` rows and history.
- **Common item dependency** — if the target game already holds a `GameCommonItem` whose
  `copied_from` is the recipe's common item, the copy points to it, left unchanged (several such
  copies → the most recent one, highest `id`). The lookup is direct only: it never walks the
  `copied_from` chain (e.g. A1 → B1 copied back into A copies a new item instead of reusing A1).
  Otherwise the
  common item is copied in the same transaction following every
  [common-items.md](../specs/game-content-copy/common-items.md) rule (fields, `hidden`, cover link,
  `copied_from`), and the recipe points to the new copy. Since the page copies entities
  sequentially, two selected recipes sharing a common item end up sharing a single copy.
- **Names** — clashes allowed (no unique constraint), never `422`.
- **API** — `GET staff/copies/recipes.json` row fields, including a nested
  `common_item: {id, name, copied_to_target}` (`copied_to_target` = it will be reused rather than
  copied); the regular `copied_to_target` of the recipe itself is kept; `POST staff/copies/recipes/<id>.json` → `links` holds 0 or 1 entry
  (the dependency common item's cover, only when it is copied). No pending-links query entry of
  its own.
- **Cache** — `X-Cache-Clear` for the target's recipe family and the reused/copied common item's
  nested `/common_items/<id>/recipes*.json` routes, plus the common item family when it is copied.
- **Frontend** — row columns (checkbox, name, common item name, reuse/copy flag, hidden badge,
  "already copied" flag).
- **Testing** — per-type backend/frontend cases.
