# Game Content Copy: Possessions

Part of [Game Content Copy](../game-content-copy.md); only the rules specific to the
**Possessions** tab. Endpoint access and exposed fields:
[Staff Copy](../access-control/staff-copy.md).

`GamePossession` has the fields of an item (`name`, `description`, `hidden`, name clashes
allowed) and the single fixed-path photo of a faction.

## Model

- Tab slug `possessions`, label "Possessions", model `GamePossession`
  (`backend/games/models/game/game_possession.py`): `game`, `name`, `description`, `hidden`,
  cover `photo` FK to `GamePossessionPhoto`, `copied_from`.
- Copy type: `PossessionsCopyType` (`backend/staff/copy_types_possessions.py`).

## Copied fields

| Field | Value on the copy |
|-------|-------------------|
| `name`, `description`, `hidden` | Source value. |
| `game` | The target game. |
| `copied_from` | The source possession. |
| `photo` | Null at copy time, set by the cover link's finalize. |

## Not copied

- Owners: `CharacterPossession` rows pointing to the source. The copy starts unowned.
- The source's history.

## Photo

- A `GamePossession` has at most one photo, at the fixed path
  `photos/games/<slug>/possessions/<id>/photo<ext>` (no uuid).
- Only the source's cover `photo`, when `ready=true`, is copied (`CoverPhotoLinkBuilder`); any
  other `GamePossessionPhoto` row is ignored.
- The cover becomes one `GamePossessionPhoto` row of the copy, `ready=false`, at
  `photos/games/<target-slug>/possessions/<copy-id>/photo<ext>`, with one copy-origin `Upload`
  (`upload_type=image`, `is_cover=true`). Its finalize sets the copy's `photo` FK;
  `_set_possession_photo` does not run.
- No photo, or a not-ready cover: no photo and no link (`links` holds 0 or 1 entry).

## Names

Name clashes in the target game are allowed: `GamePossession` has no unique name constraint.

## List rows

`GET staff/copies/possessions.json` lists every possession of the source game (hidden ones
included), ordered by `id`: `id`, `name`, `hidden`, `photo` (cover path when ready, else null)
and `copied_to_target`.

## Cache

The copy `201` and the cover link's finalize send `X-Cache-Clear`
(`possessions_copy_cache_paths`), cleared on every domain
([Cache](../game-content-copy.md#cache)):

- the target's possession family, the same as the staff photo type `game_possession`:
  - `/games/<target>/possessions.json`
  - `/games/<target>/possessions/all.json`
  - `/games/<target>/possessions/<copy-id>.json`
  - `/games/<target>/possessions/<copy-id>/full.json`
- `/games/<target>/<pcs|npcs>/<character-id>/possessions/available.json` for **every**
  character of the target game. A game without characters adds none.

Nothing else needs clearing: the `possessions/available/all.json` variants always send
`X-Skip-Cache`, and no character's `possessions.json` changes because the copy has no owners.

## Frontend

`StaffCopyPossessionRow` renders the cover thumbnail, the name and the hidden badge.
