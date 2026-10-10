# Game Content Copy — Recipes

Part of the [Game Content Copy](../game-content-copy.md) spec. Only adds the rules specific to
the **Recipes** tab; everything else follows the global pages: [page.md](page.md),
[copy-flow.md](copy-flow.md), [hard-links.md](hard-links.md) and
[permissions.md](permissions.md).

## Model

- Tab slug `recipes`, label "Recipes", model `GameRecipe`
  (`backend/games/models/game/game_recipe.py`): `game`, `name`, `description`, `hidden`,
  `game_common_item` FK → `GameCommonItem` (`CASCADE`, `related_name='recipes'`, required),
  `yield_quantity`, `crafting_time`, `crafting_cost`, `ingredients`, `checks`.
- Recipes have **no photos**: no photo model and no cover FK
  ([hard-links.md](hard-links.md#storage-roots)).

## Copied fields

| Field | Value on the copy |
|---|---|
| `name`, `description`, `yield_quantity`, `crafting_time`, `crafting_cost`, `ingredients`, `checks` | Source value. |
| `hidden` | Source value ([copy-flow.md](copy-flow.md#hidden)). |
| `game` | The target game. |
| `copied_from` | The source recipe ([copy-flow.md](copy-flow.md#copied_from)). |
| `game_common_item` | A common item of the target game, resolved as in [Common item](#common-item). |

## Not copied

- `CharacterRecipe` rows pointing to the source.
- The source's history.

See [copy-flow.md](copy-flow.md#character-links-and-history).

## Common item

`GameRecipe` is the only copyable model with a required in-game FK, and a copy never references
a row of another game ([copy-flow.md](copy-flow.md#same-game-references)). The source recipe's
common item is resolved in the target game as follows:

- **Reuse** — when the target game holds a `GameCommonItem` whose `copied_from` is the source
  recipe's common item, the copy points to it. With several such copies, the most recent one
  (highest `id`) is used. The reused common item is left unchanged: no field update, no new
  photo row, no link.
- **Direct lookup only** — the `copied_from` chain is never walked. Example: common item A1 of
  game A is copied into game B as B1; copying a recipe of B (pointing to B1) back into A does
  **not** reuse A1 (B1's `copied_from` is A1, but no common item of A has `copied_from` = B1), so
  a new common item is copied into A.
- **Copy** — otherwise, the common item is copied **inside the same transaction** as the recipe,
  following every rule of [common-items.md](common-items.md): copied fields, `hidden` (a hidden
  source common item is copied hidden), `copied_from`, and the cover photo row with its
  copy-origin `Upload` (`is_cover=true`) when the source cover is ready. The recipe points to the
  new copy. A failure rolls back both the recipe and the common item.
- **Sequential copies** — the page copies selected entities one request at a time
  ([page.md](page.md#execution-and-progress)), so when two selected recipes share a common item
  that has no copy in the target yet, the first request copies it and the second one reuses that
  copy: both recipes end up sharing a single common item copy.

A common item copied this way is later listed in the Common items tab with `copied_to_target`
set ([common-items.md](common-items.md#recipes-tab-interaction)).

## Names

Name clashes in the target game are allowed (`GameRecipe` has no unique name constraint): the
copy never answers `422` for names ([copy-flow.md](copy-flow.md#names)). The same holds for a
common item copied as a dependency.

## API

Global shapes in [copy-flow.md](copy-flow.md#api).

- `GET staff/copies/recipes.json?from=<slug>&to=<slug>` — paginated, ordered by `id`. Lists
  **every** recipe of the source game, hidden ones included. Row fields:

  | Field | Value |
  |---|---|
  | `id` | Source recipe id. |
  | `name` | Source recipe name. |
  | `hidden` | Source `hidden` flag. |
  | `yield_quantity` | Source `yield_quantity`. |
  | `crafting_cost` | Source `crafting_cost`. |
  | `common_item` | `{id, name, copied_to_target}` of the source recipe's common item; `copied_to_target` is true when a copy will be reused rather than a new one copied (see [Common item](#common-item)). |
  | `copied_to_target` | Of the recipe itself, see [copy-flow.md](copy-flow.md#copied_from). |

- `POST staff/copies/recipes/<id>.json` `{target}` — global responses; `id` is the new recipe's
  id. `links` holds 0 or 1 entry: the dependency common item's cover, only when the common item
  is copied (not reused) and its source cover is ready.
- Pending-links query ([hard-links.md](hard-links.md#pending-links-query)): recipes add no photo
  type of their own. A dependency cover is a `GameCommonItemPhoto`, already covered by
  [common-items.md](common-items.md#api).

`copied_from` itself is never exposed, only the `copied_to_target` flags.

## Cache

The copy `201` sends `X-Cache-Clear` for the target game's stale paths, cleared on every domain
([permissions.md](permissions.md#cache)):

- the recipe family of the target, built with `GameResourceCachePaths('recipes', **FULL_FAMILY)`
  (`backend/staff/photo_cache_paths.py`):
  - `/games/<target>/recipes.json`
  - `/games/<target>/recipes/all.json`
  - `/games/<target>/recipes/<copy-id>.json`
  - `/games/<target>/recipes/<copy-id>/full.json`
- the nested recipe lists of the resolved common item, reused or copied (a reused one gains a
  recipe):
  - `/games/<target>/common_items/<common-item-id>/recipes.json`
  - `/games/<target>/common_items/<common-item-id>/recipes/all.json`
- when the common item is copied (not reused): the common item family exactly as in
  [common-items.md](common-items.md#cache). Its cover link's finalize clears that family again,
  as for any common item copy.

No clearing is needed for:

- `/games/<target>/recipes/<copy-id>/characters*.json` — a fresh copy has no characters;
- the characters' available-recipe lists
  (`/games/<target>/{pcs,npcs}/<id>/recipes/available*.json`) — they gain an entry, but they are
  always `X-Skip-Cache` (`character_recipes_available`), so never cached.

Today the regular recipe create/update views send no `X-Cache-Clear` and the proxy cleanup map
has no recipes group, so they can leave the cached recipe lists stale. The copy does not depend
on that gap being fixed: it lists its own paths above.

## Frontend

Only the row component is tab-specific ([page.md](page.md#frontend-structure)). Columns:

1. checkbox;
2. name;
3. common item name (`common_item.name`), with a "reused" indicator when
   `common_item.copied_to_target`, else "will be copied";
4. hidden badge (when `hidden`);
5. "already copied" flag (when `copied_to_target`).

The common item indicator reflects the list as loaded: a common item copied earlier in the same
run still shows "will be copied" until the source list is reloaded. This is display only, the
backend resolves the dependency at copy time ([Common item](#common-item)).

## Testing

Per-type cases, on top of the global strategy ([../game-content-copy.md](../game-content-copy.md)):

- **backend** — `name`/`description`/`yield_quantity`/`crafting_time`/`crafting_cost`/
  `ingredients`/`checks`/`hidden`/`copied_from` copied and `game` set to the target; reuse of an
  existing direct copy of the common item (no new common item, no link, reused one unchanged);
  most recent copy chosen among several; `copied_from` chain not walked; common item copied in
  the same transaction when no copy exists (fields, `hidden`, `copied_from`, cover link with
  `is_cover=true`; no link for no photo or a not-ready cover); rollback of both on failure;
  `CharacterRecipe` rows not copied; name clash allowed; list row fields including the nested
  `common_item` and its `copied_to_target`; hidden recipes listed; `X-Cache-Clear` paths for both
  the reuse and the copy cases.
- **frontend** — row rendering: name, common item name, reused / will-be-copied indicator, hidden
  badge, "already copied" flag.
