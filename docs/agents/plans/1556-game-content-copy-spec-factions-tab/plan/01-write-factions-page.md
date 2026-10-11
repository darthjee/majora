# Write the factions tab page

Create `docs/agents/specs/game-content-copy/factions.md`, modelled on `items.md` and
`documents.md` (intro paragraph linking the four global pages, then the sections below).

- **Model** — tab slug `factions`, label "Factions", model `GameFaction`
  (`backend/games/models/game/game_faction.py`): `game`, `name`, cover `photo` FK →
  `GameFactionPhoto` (`SET_NULL`, `related_name='+'`), simple-history, unique constraint
  `unique_faction_name_per_game` on `(game, name)`. `GameFactionPhoto` (`BasePhoto`: `path`,
  `ready`): `faction` FK (`related_name='photos'`). No `hidden`, no `description`.
- **Copied fields** table — `name` (source), `game` (target), `copied_from` (source, link to
  `copy-flow.md#copied_from`), `photo` (null at copy time, set by the cover finalize, link to
  `copy-flow.md#cover-photo`). State there is no `hidden` to copy (`copy-flow.md#hidden`).
- **Not copied** — members (`CharacterFaction`, character-scoped), the source's history, a
  missing or not-ready cover, and any non-cover `GameFactionPhoto` rows.
- **Photo** — only the source's cover `photo`, only when `ready=true`; otherwise no row, no link,
  `photo` stays null. One new `GameFactionPhoto`, `ready=false`, at the path built like
  `game_faction_photo_upload` (`backend/games/views/games/game_faction_photo_upload.py`):
  `PhotoPathBuilder` segments `['games', <target-slug>, 'factions', <copy-id>]`, name
  `photo<ext>` (extension from the source path), `use_uuid=False`, `root='photos'` — i.e.
  `photos/games/<target-slug>/factions/<copy-id>/photo<ext>`. One copy-origin `Upload`,
  `upload_type=image`, `is_cover=true`; its finalize (`CopyLinkFinalizer`) sets the copy's
  `photo` FK. Explain why a fixed path is safe: the copy id is new, so the path is never taken.
- **Names** — the `422` `{"errors": {"name": ["unique"]}}`, nothing created
  (`copy-flow.md#names`), including a re-copy of a faction already copied and not renamed; the
  page shows "name already used" for that entity (`page.md#execution-and-progress`). Introduce
  `name_taken_in_target`: true when a `GameFaction` with the same `name` exists in the target
  game; the row shows a "name already used" badge but stays selectable, and the copy still
  answers `422` if the name is taken at copy time (race-safe through the DB constraint, which
  the copy handler maps to `422`).
- **API** — `GET staff/copies/factions.json?from=<slug>&to=<slug>` (paginated, ordered by `id`)
  row table: `id`, `name`, `photo` (cover path when ready, else null), `copied_to_target`,
  `name_taken_in_target`. `POST staff/copies/factions/<id>.json` `{target}` — global responses,
  `links` with 0..1 entries. Pending-links query: `GameFactionPhoto` reaches its game through
  `faction__game`. `copied_from` never exposed.
- **Cache** — the copy `201` and the link finalize send `X-Cache-Clear` for the target's faction
  family on every domain (`permissions.md#cache`), reusing `GameResourceCachePaths('factions')`
  as the staff photo type does (`backend/staff/photo_types.py`). List the resulting paths
  (verify them against `backend/staff/photo_cache_paths.py`), e.g.
  `/games/<target>/factions.json`, `/games/<target>/factions/all.json`,
  `/games/<target>/factions/<copy-id>.json`, `/games/<target>/factions/<copy-id>/full.json`,
  plus whatever photo paths the family includes. No member list to clear (the copy has none).
- **Frontend** — row columns: checkbox; cover thumbnail (placeholder when `photo` is null);
  name; "already copied" flag (`copied_to_target`); "name already used" badge
  (`name_taken_in_target`). No hidden badge.
- **Testing** — backend: `name`/`copied_from` copied, `game` set; `photo` null at copy time;
  ready cover → one link with `is_cover=true` at the fixed path; not-ready/missing cover → no
  link; non-cover photos ignored; `422` on name clash and on re-copy, nothing created; list
  fields incl. `name_taken_in_target` true/false; cover finalize sets `photo`; pending-links
  query via `faction__game`; `X-Cache-Clear` paths. Frontend: row rendering incl. both flags and
  the placeholder.

## Files to Change

- `docs/agents/specs/game-content-copy/factions.md` — new tab page.
