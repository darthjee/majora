# Game Content Copy: Factions

Part of [Game Content Copy](../game-content-copy.md); only the rules specific to the
**Factions** tab. Endpoint access and exposed fields:
[Staff Copy](../access-control/staff-copy.md).

`GameFaction` is the simplest copyable type in fields (no `hidden`, no `description`), but the
only one with a unique name per game, so the only type whose copy can answer `422`.

## Model

- Tab slug `factions`, label "Factions", model `GameFaction`
  (`backend/games/models/game/game_faction.py`): `game`, `name`, cover `photo` FK to
  `GameFactionPhoto`, `copied_from`. Unique constraint `unique_faction_name_per_game` on
  `(game, name)`.
- Copy type: `FactionsCopyType` (`backend/staff/copy_types_factions.py`).

## Copied fields

| Field | Value on the copy |
|-------|-------------------|
| `name` | Source value (see [Names](#names)). |
| `game` | The target game. |
| `copied_from` | The source faction. |
| `photo` | Null at copy time, set by the cover link's finalize. |

There is no `hidden` to copy.

## Not copied

- Members: `CharacterFaction` rows pointing to the source. The copy starts with no members.
- The source's history.

## Photo

- A `GameFaction` has at most one photo, at the fixed path
  `photos/games/<slug>/factions/<id>/photo<ext>` (no uuid).
- Only the source's cover `photo`, when `ready=true`, is copied (`CoverPhotoLinkBuilder`); any
  other `GameFactionPhoto` row is ignored.
- The cover becomes one `GameFactionPhoto` row of the copy, `ready=false`, at
  `photos/games/<target-slug>/factions/<copy-id>/photo<ext>`, with one copy-origin `Upload`
  (`upload_type=image`, `is_cover=true`). Its finalize sets the copy's `photo` FK.
- No photo, or a not-ready cover: no photo and no link (`links` holds 0 or 1 entry).

## Names

A clash with an existing faction name in the target game answers `422`
`{"errors": {"name": ["unique"]}}` and **nothing is created**: no faction, photo row or
`Upload`, and nothing is cleared. This includes re-copying a faction already copied into the
target and not renamed there. The check is race-safe: `FactionsCopyType.copy` maps the
database `IntegrityError` to the `422`, rolling the transaction back. The page reports that
entity as failed with "name already used" and keeps going.

To surface clashes before copying, factions list rows carry `name_taken_in_target`: `true` when
a `GameFaction` with the same `name` exists in the target game. The row shows a "name already
used" badge but **stays selectable**: the name may be freed or taken between listing and
copying, so the copy itself remains the source of truth. The flag reveals only whether the name
exists in the target, never the target faction's id or data.

## List rows

`GET staff/copies/factions.json` lists every faction of the source game, ordered by `id`: `id`,
`name`, `photo` (cover path when ready, else null), `copied_to_target` and
`name_taken_in_target`.

## Cache

The copy `201` and the cover link's finalize send `X-Cache-Clear`
(`factions_copy_cache_paths`), cleared on every domain
([Cache](../game-content-copy.md#cache)):

- the target's faction family (`GameResourceCachePaths('factions')`, the same as the staff
  photo type `game_faction`):
  - `/games/<target>/factions.json`
  - `/games/<target>/factions/<copy-id>.json`
- `/games/<target>/<pcs|npcs>/<character-id>/factions/available.json` for **every** character of
  the target game. A game without characters adds none.

The member lists (`/factions/<copy-id>/characters*.json`) need no clearing: the copy has no
members and its id was never cached. The `factions/available/all.json` variants always send
`X-Skip-Cache`. A `422` clears nothing.

## Frontend

`StaffCopyFactionRow` renders the cover thumbnail and the name (no hidden badge). The shared
status cell shows the "already copied" flag and the "name already used" badge; the checkbox
stays enabled.
