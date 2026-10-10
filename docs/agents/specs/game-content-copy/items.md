# Game Content Copy — Items

Part of the [Game Content Copy](../game-content-copy.md) spec. Only adds the rules specific to
the **Items** tab; everything else follows the global pages: [page.md](page.md),
[copy-flow.md](copy-flow.md), [hard-links.md](hard-links.md) and
[permissions.md](permissions.md).

## Model

- Tab slug `items`, label "Items", model `GameItem` (`backend/games/models/game/game_item.py`):
  `game`, `name`, `description`, `hidden`, cover `photo` FK → `GameItemPhoto` (`SET_NULL`).
- `GameItemPhoto` (`backend/games/models/game/game_item_photo.py`): `path`, `ready`,
  `game_item` FK (`related_name='photos'`).

## Copied fields

| Field | Value on the copy |
|---|---|
| `name`, `description` | Source value. |
| `hidden` | Source value ([copy-flow.md](copy-flow.md#hidden)). |
| `game` | The target game. |
| `copied_from` | The source item ([copy-flow.md](copy-flow.md#copied_from)). |
| `photo` | Null at copy time, set by the cover link's finalize ([copy-flow.md](copy-flow.md#cover-photo)). |

## Not copied

- `CharacterItem` rows pointing to the source, and their `CharacterItemPhoto` overrides.
- The source's history.

See [copy-flow.md](copy-flow.md#character-links-and-history).

## Photo

- A `GameItem` has **at most one** photo: `game_item_photo_upload` reuses the item's cover row
  and always writes the fixed path `games/<slug>/items/<id>/photo<ext>` (no uuid). A re-upload
  puts that row back to `ready=false` until finalized.
- Only the source's cover `photo`, when `ready=true`, is copied. Any other `GameItemPhoto` row
  of the item (e.g. a legacy orphan) is ignored: it would collide on the same fixed target path.
- The cover becomes one `GameItemPhoto` row of the copy, `ready=false`, at
  `photos/games/<target-slug>/items/<copy-id>/photo<ext>`: same `PhotoPathBuilder` segments and
  `photo<ext>` name as the regular upload, no uuid, `root='photos'`, extension kept from the
  source path ([hard-links.md](hard-links.md#storage-roots)).
- It gets one copy-origin `Upload` with `upload_type=image` and `is_cover=true`. Its finalize
  (`CopyLinkFinalizer`) sets the copy's `photo` FK; `_set_item_photo` does not run
  ([hard-links.md](hard-links.md#finalize)).
- A source with no photo, or whose cover is not ready (re-upload in progress), is copied with no
  photo and no link.

## Names

Name clashes in the target game are allowed (`GameItem` has no unique name constraint): the copy
never answers `422` for names ([copy-flow.md](copy-flow.md#names)).

## API

Global shapes in [copy-flow.md](copy-flow.md#api).

- `GET staff/copies/items.json?from=<slug>&to=<slug>` — paginated, ordered by `id`. Lists
  **every** item of the source game, hidden ones included. Row fields:

  | Field | Value |
  |---|---|
  | `id` | Source item id. |
  | `name` | Source item name. |
  | `hidden` | Source `hidden` flag. |
  | `photo` | Path of the cover `photo` when it is `ready`, else null. |
  | `copied_to_target` | See [copy-flow.md](copy-flow.md#copied_from). |

- `POST staff/copies/items/<id>.json` `{target}` — global responses; `links` holds 0 or 1 entry
  (the cover).
- Pending-links query ([hard-links.md](hard-links.md#pending-links-query)): a `GameItemPhoto`
  reaches its game through `game_item__game`.

`copied_from` itself is never exposed, only `copied_to_target`.

## Cache

The copy `201` and the cover link's finalize send `X-Cache-Clear` for the target game's item
family, cleared on every domain ([permissions.md](permissions.md#cache)):

- `/games/<target>/items.json`
- `/games/<target>/items/all.json`
- `/games/<target>/items/<copy-id>.json`
- `/games/<target>/items/<copy-id>/full.json`

Built by reusing `GameResourceCachePaths('items', **FULL_FAMILY)`, the same family as the staff
photo type `game_item` (`backend/staff/photo_types.py`).

## Frontend

Only the row component is tab-specific ([page.md](page.md#frontend-structure)). Columns:

1. checkbox;
2. cover thumbnail (placeholder when `photo` is null);
3. name;
4. hidden badge (when `hidden`);
5. "already copied" flag (when `copied_to_target`).

## Testing

Per-type cases, on top of the global strategy ([../game-content-copy.md](../game-content-copy.md)):

- **backend** — `name`/`description`/`hidden`/`copied_from` copied and `game` set to the target;
  `photo` null at copy time; one link with `is_cover=true` for a ready cover, at the expected
  path and extension; no link for no photo or a not-ready cover; a non-cover `GameItemPhoto` is
  ignored; `CharacterItem` rows not copied; name clash allowed; list row fields (`photo` only
  when ready), hidden items listed; finalize sets the copy's `photo`; `X-Cache-Clear` paths;
  pending-links query reaching the game through `game_item__game`.
- **frontend** — row rendering: thumbnail, placeholder, hidden badge, "already copied" flag.
