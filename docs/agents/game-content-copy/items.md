# Game Content Copy: Items

Part of [Game Content Copy](../game-content-copy.md); only the rules specific to the **Items**
tab. Endpoint access and exposed fields: [Staff Copy](../access-control/staff-copy.md).

## Model

- Tab slug `items`, label "Items", model `GameItem`
  (`backend/games/models/game/game_item.py`): `game`, `name`, `description`, `hidden`, cover
  `photo` FK to `GameItemPhoto`, `copied_from`.
- Copy type: `ItemsCopyType` (`backend/staff/copy_types_items.py`).

## Copied fields

| Field | Value on the copy |
|-------|-------------------|
| `name`, `description`, `hidden` | Source value. |
| `game` | The target game. |
| `copied_from` | The source item. |
| `photo` | Null at copy time, set by the cover link's finalize. |

## Not copied

- `CharacterItem` rows pointing to the source, and their `CharacterItemPhoto` overrides.
- The source's history.

## Photo

- A `GameItem` has at most one photo: its regular upload reuses the cover row and writes the
  fixed path `games/<slug>/items/<id>/photo<ext>` (no uuid).
- Only the source's cover `photo`, when `ready=true`, is copied (`CoverPhotoLinkBuilder`). Any
  other `GameItemPhoto` row of the item is ignored: it would collide on the same fixed target
  path.
- The cover becomes one `GameItemPhoto` row of the copy, `ready=false`, at
  `photos/games/<target-slug>/items/<copy-id>/photo<ext>` (extension kept from the source), with
  one copy-origin `Upload` (`upload_type=image`, `is_cover=true`). Its finalize sets the copy's
  `photo` FK.
- A source with no photo, or whose cover is not ready, is copied with no photo and no link: the
  `201` `links` holds 0 or 1 entry.

## Names

Name clashes in the target game are allowed: `GameItem` has no unique name constraint.

## List rows

`GET staff/copies/items.json` lists every item of the source game (hidden ones included),
ordered by `id`: `id`, `name`, `hidden`, `photo` (cover path when ready, else null) and
`copied_to_target`.

## Cache

The copy `201` and the cover link's finalize send `X-Cache-Clear`
(`items_copy_cache_paths` in `backend/staff/copy_cache_paths.py`), cleared on every domain
([Cache](../game-content-copy.md#cache)):

- the target's item family, the same as the staff photo type `game_item`:
  - `/games/<target>/items.json`
  - `/games/<target>/items/all.json`
  - `/games/<target>/items/<copy-id>.json`
  - `/games/<target>/items/<copy-id>/full.json`
- `/games/<target>/<pcs|npcs>/<character-id>/items/available.json` for **every** character of
  the target game (hidden NPCs included, harmlessly). A game without characters adds none.

Nothing else needs clearing: the `items/available/all.json` variants always send
`X-Skip-Cache`, and no character's `items.json` changes because the copy has no owners.

## Frontend

`StaffCopyItemRow` renders the cover thumbnail (placeholder when `photo` is null), the name and
the hidden badge, between the shared checkbox and status ("already copied") cells.
