# Game Content Copy — Possessions

Part of the [Game Content Copy](../game-content-copy.md) spec. Only adds the rules specific to
the **Possessions** tab; everything else follows the global pages: [page.md](page.md),
[copy-flow.md](copy-flow.md), [hard-links.md](hard-links.md) and
[permissions.md](permissions.md).

`GamePossession` has the fields of an item (`name`, `description`, `hidden`, name clashes
allowed) and the single fixed-path photo of a faction. Its copy also adds an entry to every
target character's list of available possessions, so those cached lists are cleared too.

## Model

- Tab slug `possessions`, label "Possessions", model `GamePossession`
  (`backend/games/models/game/game_possession.py`): `game`, `name`, `description`, `hidden`,
  cover `photo` FK → `GamePossessionPhoto` (`SET_NULL`, `related_name='+'`), simple-history. No
  unique constraint.
- `GamePossessionPhoto` (`backend/games/models/game/game_possession_photo.py`, `BasePhoto`:
  `path`, `ready`): `game_possession` FK (`related_name='photos'`).
- `CharacterPossession` (`backend/games/models/character/character_possession.py`) links a
  character to a possession; it is character-scoped and never copied.

## Copied fields

| Field | Value on the copy |
|---|---|
| `name`, `description` | Source value. |
| `hidden` | Source value ([copy-flow.md](copy-flow.md#hidden)). |
| `game` | The target game. |
| `copied_from` | The source possession ([copy-flow.md](copy-flow.md#copied_from)). |
| `photo` | Null at copy time, set by the cover link's finalize ([copy-flow.md](copy-flow.md#cover-photo)). |

## Not copied

- Owners: `CharacterPossession` rows pointing to the source. The copy starts unowned.
- The source's history (simple-history).
- A missing or not-ready cover photo, and any non-cover `GamePossessionPhoto` row of the source.

See [copy-flow.md](copy-flow.md#character-links-and-history).

## Photo

- A `GamePossession` has **at most one** photo: `game_possession_photo_upload`
  (`backend/games/views/games/game_possession_photo_upload.py`) reuses the possession's cover
  row when set and always writes the fixed path `photos/games/<slug>/possessions/<id>/photo<ext>`
  (no uuid); the upload finalize (`_set_possession_photo` in `backend/uploads/views.py`) always
  replaces the cover. A re-upload puts that row back to `ready=false` until finalized.
- Only the source's cover `photo`, when `ready=true`, is copied. Any other `GamePossessionPhoto`
  row pointing at the possession (e.g. a legacy orphan) is ignored: it would collide on the same
  fixed target path.
- The cover becomes one new `GamePossessionPhoto` row of the copy, `ready=false`, at the path
  built like `game_possession_photo_upload`: `PhotoPathBuilder` segments
  `['games', <target-slug>, 'possessions', <copy-id>]`, name `photo<ext>` (extension kept from
  the source path), `use_uuid=False`, `root='photos'` — i.e.
  `photos/games/<target-slug>/possessions/<copy-id>/photo<ext>`
  ([hard-links.md](hard-links.md#storage-roots)). The fixed path is safe: the copy id is new, so
  the target path is never already taken.
- It gets one copy-origin `Upload` with `upload_type=image` and `is_cover=true`. Its finalize
  (`CopyLinkFinalizer`) sets the copy's `photo` FK; `_set_possession_photo` does not run
  ([hard-links.md](hard-links.md#finalize)).
- A source with no photo, or whose cover is not ready (re-upload in progress), is copied with no
  photo and no link; the copy's `photo` stays null.

## Names

Name clashes in the target game are allowed (`GamePossession` has no unique name constraint):
the copy never answers `422` for names ([copy-flow.md](copy-flow.md#names)).

## API

Global shapes in [copy-flow.md](copy-flow.md#api).

- `GET staff/copies/possessions.json?from=<slug>&to=<slug>` — paginated, ordered by `id`. Lists
  **every** possession of the source game, hidden ones included. Row fields:

  | Field | Value |
  |---|---|
  | `id` | Source possession id. |
  | `name` | Source possession name. |
  | `hidden` | Source `hidden` flag. |
  | `photo` | Path of the cover `photo` when it is `ready`, else null. |
  | `copied_to_target` | See [copy-flow.md](copy-flow.md#copied_from). |

- `POST staff/copies/possessions/<id>.json` `{target}` — global responses; `links` holds 0 or 1
  entry (the cover).
- Pending-links query ([hard-links.md](hard-links.md#pending-links-query)): a
  `GamePossessionPhoto` reaches its game through `game_possession__game`.

`copied_from` itself is never exposed, only `copied_to_target`.

## Cache

The copy `201` and the cover link's finalize send `X-Cache-Clear`, cleared on every domain
([permissions.md](permissions.md#cache)), with:

- the target game's possession family:
  - `/games/<target>/possessions.json`
  - `/games/<target>/possessions/all.json`
  - `/games/<target>/possessions/<copy-id>.json`
  - `/games/<target>/possessions/<copy-id>/full.json`

  Built by reusing `GameResourceCachePaths('possessions', **FULL_FAMILY)`, the same family as the
  staff photo type `game_possession` (`backend/staff/photo_types.py`).
- `/games/<target>/pcs/<id>/possessions/available.json` for **every** PC, and
  `/games/<target>/npcs/<id>/possessions/available.json` for **every** NPC, of the target game
  (`pcs` vs `npcs` by the character's `npc` flag). These lists are built from the target game's
  characters at response time. The copy adds an entry to each of them, and
  `character_possessions_available`
  (`backend/games/views/game/possessions/_possession_exchange.py`) caches them except for a
  hidden NPC (`X-Skip-Cache`); clearing a hidden NPC's path anyway is harmless. A target game with
  no characters adds no such path.

Nothing else needs clearing: the `possessions/available/all.json` variants always send
`X-Skip-Cache`, and no character's `possessions.json` list changes because the copy has no
owners.

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
  `photo` null at copy time; one link with `is_cover=true` for a ready cover, at the fixed
  `photo<ext>` path with the source extension; no link for no photo or a not-ready cover; a
  non-cover `GamePossessionPhoto` is ignored; `CharacterPossession` rows not copied; name clash
  allowed; list row fields (`photo` only when ready), hidden possessions listed; cover finalize
  sets the copy's `photo`; pending-links query reaching the game through
  `game_possession__game`; `X-Cache-Clear` holds the possession family plus one
  `possessions/available.json` path per target PC and NPC, and only the family when the target
  game has no characters.
- **frontend** — row rendering: thumbnail, placeholder, hidden badge, "already copied" flag.
