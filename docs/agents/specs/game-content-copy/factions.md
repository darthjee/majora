# Game Content Copy — Factions

Part of the [Game Content Copy](../game-content-copy.md) spec. Only adds the rules specific to
the **Factions** tab; everything else follows the global pages: [page.md](page.md),
[copy-flow.md](copy-flow.md), [hard-links.md](hard-links.md) and
[permissions.md](permissions.md).

`GameFaction` is the simplest copyable type in fields (no `hidden`, no `description`), but the
only one with a unique name per game, so it is the only type whose copy can answer `422`. Its
copy also adds an entry to every target character's list of available factions, so those cached
lists are cleared too.

## Model

- Tab slug `factions`, label "Factions", model `GameFaction`
  (`backend/games/models/game/game_faction.py`): `game`, `name`, cover `photo` FK →
  `GameFactionPhoto` (`SET_NULL`, `related_name='+'`), simple-history. Unique constraint
  `unique_faction_name_per_game` on `(game, name)`.
- `GameFactionPhoto` (`backend/games/models/game/game_faction_photo.py`, `BasePhoto`: `path`,
  `ready`): `faction` FK (`related_name='photos'`).
- No `hidden` and no `description` field.

## Copied fields

| Field | Value on the copy |
|---|---|
| `name` | Source value (see [Names](#names)). |
| `game` | The target game. |
| `copied_from` | The source faction ([copy-flow.md](copy-flow.md#copied_from)). |
| `photo` | Null at copy time, set by the cover link's finalize ([copy-flow.md](copy-flow.md#cover-photo)). |

There is no `hidden` to copy ([copy-flow.md](copy-flow.md#hidden)).

## Not copied

- Members: `CharacterFaction` rows pointing to the source (character-scoped, with their own
  `hidden` flag). The copy starts with no members.
- The source's history (simple-history).
- A missing or not-ready cover photo, and any non-cover `GameFactionPhoto` row of the source.

See [copy-flow.md](copy-flow.md#character-links-and-history).

## Photo

- A `GameFaction` has **at most one** photo: `game_faction_photo_upload`
  (`backend/games/views/games/game_faction_photo_upload.py`) reuses the faction's cover row when
  set and always writes the fixed path `photos/games/<slug>/factions/<id>/photo<ext>` (no uuid).
  A re-upload puts that row back to `ready=false` until finalized.
- Only the source's cover `photo`, when `ready=true`, is copied. Any other `GameFactionPhoto`
  row pointing at the faction (e.g. a legacy orphan) is ignored: it would collide on the same
  fixed target path.
- The cover becomes one new `GameFactionPhoto` row of the copy, `ready=false`, at the path built
  like `game_faction_photo_upload`: `PhotoPathBuilder` segments
  `['games', <target-slug>, 'factions', <copy-id>]`, name `photo<ext>` (extension kept from the
  source path), `use_uuid=False`, `root='photos'` — i.e.
  `photos/games/<target-slug>/factions/<copy-id>/photo<ext>`
  ([hard-links.md](hard-links.md#storage-roots)). The fixed path is safe: the copy id is new, so
  the target path is never already taken.
- It gets one copy-origin `Upload` with `upload_type=image` and `is_cover=true`. Its finalize
  (`CopyLinkFinalizer`) sets the copy's `photo` FK; the regular upload's cover handling does not
  run ([hard-links.md](hard-links.md#finalize)).
- A source with no photo, or whose cover is not ready (re-upload in progress), is copied with no
  photo and no link; the copy's `photo` stays null.

## Names

`GameFaction` has a unique `(game, name)` constraint, so a clash with an existing faction of the
target game answers `422` `{"errors": {"name": ["unique"]}}` and **nothing is created**
([copy-flow.md](copy-flow.md#names)). This includes re-copying a faction that was already copied
into the target and not renamed there since. The page reports that entity as failed with "name
already used" ([page.md](page.md#execution-and-progress)) and keeps going with the others.

To surface clashes before copying, factions list rows expose a factions-only
`name_taken_in_target` boolean: `true` when a `GameFaction` with the same `name` exists in the
target game. The row shows a "name already used" badge but **stays selectable**: the name may be
freed (or taken) between listing and copying, so the copy itself remains the source of truth.
The copy still answers `422` when the name is taken at copy time, race-safe through the DB
constraint (the copy handler maps the integrity error to `422`, rolling the transaction back).

## API

Global shapes in [copy-flow.md](copy-flow.md#api).

- `GET staff/copies/factions.json?from=<slug>&to=<slug>` — paginated, ordered by `id`. Lists
  **every** faction of the source game. Row fields:

  | Field | Value |
  |---|---|
  | `id` | Source faction id. |
  | `name` | Source faction name. |
  | `photo` | Path of the cover `photo` when it is `ready`, else null. |
  | `copied_to_target` | See [copy-flow.md](copy-flow.md#copied_from). |
  | `name_taken_in_target` | A faction with the same `name` exists in the target game ([Names](#names)). |

- `POST staff/copies/factions/<id>.json` `{target}` — global responses plus the `422` above;
  `id` is the new faction's id. `links` holds 0 or 1 entry (the cover).
- Pending-links query ([hard-links.md](hard-links.md#pending-links-query)): a
  `GameFactionPhoto` reaches its game through `faction__game`.

`copied_from` itself is never exposed, only `copied_to_target`. `name_taken_in_target` reveals
only whether a name exists in the target, never the target faction's id or data.

## Cache

The copy `201` and the cover link's finalize send `X-Cache-Clear`, cleared on every domain
([permissions.md](permissions.md#cache)), with:

- the target game's faction family:
  - `/games/<target>/factions.json`
  - `/games/<target>/factions/<copy-id>.json`

  Built by reusing `GameResourceCachePaths('factions')` (default collection/member suffixes, no
  `FULL_FAMILY`), the same family as the staff photo type `game_faction`
  (`backend/staff/photo_types.py`, `backend/staff/photo_cache_paths.py`). No member lists
  (`/games/<target>/factions/<copy-id>/characters.json`, `.../characters/all.json`) need
  clearing: the copy has no members and its id was never cached before.
- `/games/<target>/pcs/<id>/factions/available.json` for **every** PC, and
  `/games/<target>/npcs/<id>/factions/available.json` for **every** NPC, of the target game
  (`pcs` vs `npcs` by the character's `npc` flag). These lists are built from the target game's
  characters at response time. The copy adds an entry to each of them, and
  `character_factions_available` (`backend/games/views/game/factions/_faction_exchange.py`)
  caches them except for a hidden NPC (`X-Skip-Cache`); clearing a hidden NPC's path anyway is
  harmless. A target game with no characters adds no such path.

Nothing else needs clearing: the `factions/available/all.json` variants always send
`X-Skip-Cache`.

A `422` creates nothing and clears nothing.

## Frontend

Only the row component is tab-specific ([page.md](page.md#frontend-structure)). Columns:

1. checkbox;
2. cover thumbnail (placeholder when `photo` is null);
3. name;
4. "already copied" flag (when `copied_to_target`);
5. "name already used" badge (when `name_taken_in_target`); the checkbox stays enabled.

There is no hidden badge (factions have no `hidden`).

## Testing

Per-type cases, on top of the global strategy ([../game-content-copy.md](../game-content-copy.md)):

- **backend** — `name`/`copied_from` copied and `game` set to the target; `photo` null at copy
  time; one link with `is_cover=true` for a ready cover, at the fixed `photo<ext>` path with the
  source extension; no link for no photo or a not-ready cover; a non-cover `GameFactionPhoto` is
  ignored; `CharacterFaction` rows not copied; `422` `{"errors": {"name": ["unique"]}}` on a name
  clash and on a re-copy of a not-renamed copy, with nothing created (no faction, photo or
  `Upload`); list row fields (`photo` only when ready), `name_taken_in_target` true and false;
  cover finalize sets the copy's `photo`; pending-links query reaching the game through
  `faction__game`; `X-Cache-Clear` holds the faction family plus one `factions/available.json`
  path per target PC and NPC, and only the family when the target game has no characters; a
  `422` clears nothing.
- **frontend** — row rendering: thumbnail, placeholder, name, "already copied" flag, "name
  already used" badge with the row still selectable; "name already used" result on `422`.
