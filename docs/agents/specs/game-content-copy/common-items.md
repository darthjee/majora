# Game Content Copy — Common items

Part of the [Game Content Copy](../game-content-copy.md) spec. Only adds the rules specific to
the **Common items** tab; everything else follows the global pages: [page.md](page.md),
[copy-flow.md](copy-flow.md), [hard-links.md](hard-links.md) and
[permissions.md](permissions.md).

## Model

- Tab slug `common_items`, label "Common items", model `GameCommonItem`
  (`backend/games/models/game/game_common_item.py`): `game`, `name`, `price` (integer),
  `description`, `category` (`potion`, `drug`, `consumable`, `ammunition`, `poison`, `gear`,
  `other`; default `other`), `hidden`, cover `photo` FK → `GameCommonItemPhoto` (`SET_NULL`).
- `GameCommonItemPhoto` (`backend/games/models/game/game_common_item_photo.py`): `path`, `ready`,
  `game_common_item` FK (`related_name='photos'`).

## Copied fields

| Field | Value on the copy |
|---|---|
| `name`, `price`, `description`, `category` | Source value. |
| `hidden` | Source value ([copy-flow.md](copy-flow.md#hidden)). |
| `game` | The target game. |
| `copied_from` | The source common item ([copy-flow.md](copy-flow.md#copied_from)). |
| `photo` | Null at copy time, set by the cover link's finalize ([copy-flow.md](copy-flow.md#cover-photo)). |

## Not copied

- `GameRecipe` rows pointing to the source (`GameRecipe.game_common_item`). The dependency only
  goes one way: the [Recipes](../game-content-copy.md#tab-pages) tab copies a recipe's common
  item, a common item never copies its recipes.
- The source's history.

There are no character links for common items. See
[copy-flow.md](copy-flow.md#character-links-and-history).

## Photo

- A `GameCommonItem` has **at most one** photo: `game_common_item_photo_upload` reuses the common
  item's cover row and always writes the fixed path `games/<slug>/common_items/<id>/photo<ext>`
  (no uuid). A re-upload puts that row back to `ready=false` until finalized.
- Only the source's cover `photo`, when `ready=true`, is copied. Any other `GameCommonItemPhoto`
  row of the common item (e.g. a legacy orphan) is ignored: it would collide on the same fixed
  target path.
- The cover becomes one `GameCommonItemPhoto` row of the copy, `ready=false`, at
  `photos/games/<target-slug>/common_items/<copy-id>/photo<ext>`: same `PhotoPathBuilder`
  segments and `photo<ext>` name as the regular upload, no uuid, `root='photos'`, extension kept
  from the source path ([hard-links.md](hard-links.md#storage-roots)).
- It gets one copy-origin `Upload` with `upload_type=image` and `is_cover=true`. Its finalize
  (`CopyLinkFinalizer`) sets the copy's `photo` FK; `_set_common_item_photo` does not run
  ([hard-links.md](hard-links.md#finalize)).
- A source with no photo, or whose cover is not ready (re-upload in progress), is copied with no
  photo and no link.

## Names

Name clashes in the target game are allowed (`GameCommonItem` has no unique name constraint):
the copy never answers `422` for names ([copy-flow.md](copy-flow.md#names)).

## API

Global shapes in [copy-flow.md](copy-flow.md#api).

- `GET staff/copies/common_items.json?from=<slug>&to=<slug>` — paginated, ordered by `id`.
  Lists **every** common item of the source game, hidden ones included. Row fields:

  | Field | Value |
  |---|---|
  | `id` | Source common item id. |
  | `name` | Source common item name. |
  | `category` | Source `category`, as the raw choice value (e.g. `potion`). |
  | `price` | Source `price`. |
  | `hidden` | Source `hidden` flag. |
  | `photo` | Path of the cover `photo` when it is `ready`, else null. |
  | `copied_to_target` | See [copy-flow.md](copy-flow.md#copied_from). |

- `POST staff/copies/common_items/<id>.json` `{target}` — global responses; `links` holds 0 or 1
  entry (the cover).
- Pending-links query ([hard-links.md](hard-links.md#pending-links-query)): a
  `GameCommonItemPhoto` reaches its game through `game_common_item__game`.

`copied_from` itself is never exposed, only `copied_to_target`.

## Cache

The copy `201` and the cover link's finalize send `X-Cache-Clear` for the target game's common
item family, cleared on every domain ([permissions.md](permissions.md#cache)):

- `/games/<target>/common_items.json`
- `/games/<target>/common_items/all.json`
- `/games/<target>/common_items/<copy-id>.json`
- `/games/<target>/common_items/<copy-id>/full.json`

Built by reusing `GameResourceCachePaths('common_items', **FULL_FAMILY)`, the same family as the
staff photo type `game_common_item` (`backend/staff/photo_types.py`). The nested
`/common_items/<copy-id>/recipes*.json` routes need no clearing: a fresh copy has no recipes.

## Recipes tab interaction

A common item copied as a recipe's dependency by the Recipes tab (#1554) follows exactly these
rules — copied fields, cover link, `copied_from` — so it is later listed here with
`copied_to_target` set, like any common item copied from this tab.

## Frontend

Only the row component is tab-specific ([page.md](page.md#frontend-structure)). Columns:

1. checkbox;
2. cover thumbnail (placeholder when `photo` is null);
3. name;
4. category, translated with the existing `common_item_page.category.<value>` keys (as in
   `CommonItemCategoryField`);
5. price;
6. hidden badge (when `hidden`);
7. "already copied" flag (when `copied_to_target`).

## Testing

Per-type cases, on top of the global strategy ([../game-content-copy.md](../game-content-copy.md)):

- **backend** — `name`/`price`/`description`/`category`/`hidden`/`copied_from` copied and `game`
  set to the target; `photo` null at copy time; one link with `is_cover=true` for a ready cover,
  at the expected path and extension; no link for no photo or a not-ready cover; a non-cover
  `GameCommonItemPhoto` is ignored; `GameRecipe` rows not copied; name clash allowed; list row
  fields (`category`, `price`, `photo` only when ready), hidden common items listed; finalize
  sets the copy's `photo`; `X-Cache-Clear` paths; pending-links query reaching the game through
  `game_common_item__game`.
- **frontend** — row rendering: thumbnail, placeholder, translated category, price, hidden badge,
  "already copied" flag.
