# Game Content Copy: Common items

Part of [Game Content Copy](../game-content-copy.md); only the rules specific to the **Common
items** tab. Endpoint access and exposed fields: [Staff Copy](../access-control/staff-copy.md).

## Model

- Tab slug `common_items`, label "Common items", model `GameCommonItem`
  (`backend/games/models/game/game_common_item.py`): `game`, `name`, `price`, `description`,
  `category`, `hidden`, cover `photo` FK to `GameCommonItemPhoto`, `copied_from`.
- Copy type: `CommonItemsCopyType` (`backend/staff/copy_types_common_items.py`).

## Copied fields

| Field | Value on the copy |
|-------|-------------------|
| `name`, `price`, `description`, `category`, `hidden` | Source value. |
| `game` | The target game. |
| `copied_from` | The source common item. |
| `photo` | Null at copy time, set by the cover link's finalize. |

## Not copied

- `GameRecipe` rows pointing to the source. The dependency only goes one way: the
  [Recipes](recipes.md#common-item) tab copies a recipe's common item; a common item never
  copies its recipes.
- The source's history. Common items have no character links.

## Photo

- A `GameCommonItem` has at most one photo, at the fixed path
  `games/<slug>/common_items/<id>/photo<ext>` (no uuid).
- Only the source's cover `photo`, when `ready=true`, is copied (`CoverPhotoLinkBuilder`); any
  other `GameCommonItemPhoto` row is ignored.
- The cover becomes one `GameCommonItemPhoto` row of the copy, `ready=false`, at
  `photos/games/<target-slug>/common_items/<copy-id>/photo<ext>`, with one copy-origin `Upload`
  (`upload_type=image`, `is_cover=true`). Its finalize sets the copy's `photo` FK.
- No photo, or a not-ready cover: no photo and no link (`links` holds 0 or 1 entry).

## Names

Name clashes in the target game are allowed: `GameCommonItem` has no unique name constraint.

## List rows

`GET staff/copies/common_items.json` lists every common item of the source game (hidden ones
included), ordered by `id`: `id`, `name`, `category` (raw choice value), `price`, `hidden`,
`photo` (cover path when ready, else null) and `copied_to_target`.

## Cache

The copy `201` and the cover link's finalize send `X-Cache-Clear` for the target's common item
family (`common_items_copy_cache_paths`, the same family as the staff photo type
`game_common_item`), cleared on every domain ([Cache](../game-content-copy.md#cache)):

- `/games/<target>/common_items.json`
- `/games/<target>/common_items/all.json`
- `/games/<target>/common_items/<copy-id>.json`
- `/games/<target>/common_items/<copy-id>/full.json`

The nested `/common_items/<copy-id>/recipes*.json` lists need no clearing from this tab (a
fresh copy has no recipes), and common items have no characters' available list.

## Recipes tab interaction

A common item copied as a recipe's dependency by the Recipes tab follows exactly these rules
(copied fields, cover link, `copied_from`), so it is later listed here with
`copied_to_target` set.

## Frontend

`StaffCopyCommonItemRow` renders the cover thumbnail, the name, the category (translated with
the `common_item_page.category.<value>` keys), the price and the hidden badge.
