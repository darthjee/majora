# Issue: Game content copy spec: Factions tab

## Description
Part of the "copy content between games" epic (#1550). Write the **Factions** tab page of the
spec, `docs/agents/specs/game-content-copy/factions.md`, following the same structure as the
already-written tab pages (`items.md`, `common-items.md`, `recipes.md`, `documents.md`).

The shared rules (page, copy flow, `copied_from`, cover photo, `Upload` link kind, proxy link
endpoint, pending/failed links, permissions, cache) live in the global pages
(`page.md`, `copy-flow.md`, `hard-links.md`, `permissions.md`). The factions page must
reference them, not repeat them, and only add what is specific to factions.

## Problem
`GameFaction` differs from the other copyable types in ways the global pages only mention in
passing:

- it has **no** `hidden` field and no `description` (`game`, `name`, cover `photo` FK,
  simple-history);
- it has a unique `(game, name)` constraint (`unique_faction_name_per_game`), so it is the only
  type whose copy can answer `422` on a name clash (already decided in
  `copy-flow.md#names`: `{"errors": {"name": ["unique"]}}`, nothing created);
- its photo upload uses a **fixed, deterministic** path
  (`photos/games/<slug>/factions/<id>/photo<ext>`, `use_uuid=False`) and reuses/replaces a
  single `GameFactionPhoto`, so in practice a faction has at most one photo — its cover;
- its members (`CharacterFaction`) are character-scoped and never copied.

Without a dedicated page, the backend/frontend implementation (#1558) has no precise contract
for these points.

## Expected Behavior
`docs/agents/specs/game-content-copy/factions.md` exists and covers, for the `factions` tab:

- **Model**: `GameFaction` (`backend/games/models/game/game_faction.py`) and
  `GameFactionPhoto` (`BasePhoto`, `faction` FK, `related_name='photos'`).
- **Copied fields**: `name` (source), `game` (target), `copied_from` (source), `photo` (null
  at copy time, set by the cover link's finalize). No `hidden` to copy.
- **Not copied**: members (`CharacterFaction`), the source's history, not-ready photos.
- **Photo**: only the source's **cover** `photo` is copied, and only when `ready=true`
  (a not-ready or missing cover → no photo, no link, `photo` stays null). Other
  `GameFactionPhoto` rows pointing at the faction, if any, are ignored. The copy's photo is
  one new `GameFactionPhoto`, `ready=false`, at the fixed path built like
  `game_faction_photo_upload` (`PhotoPathBuilder` segments
  `['games', <target-slug>, 'factions', <copy-id>]`, name `photo<ext>`, `use_uuid=False`) —
  i.e. `photos/games/<target-slug>/factions/<copy-id>/photo<ext>` — with one copy-origin
  `Upload` (`upload_type=image`, `is_cover=true`) whose finalize sets the copy's `photo` FK.
- **Names**: the `422` on a clash with an existing target faction (including a re-copy of an
  already-copied faction that was not renamed), referencing `copy-flow.md#names`, and how the
  page reports it ("name already used", per `page.md`). To surface clashes before copying,
  list rows expose a factions-only `name_taken_in_target` boolean (a faction with the same
  `name` exists in the target game); the row shows a "name already used" badge but **stays
  selectable** — the copy still answers `422` if the name is taken at copy time.
- **API**: `GET staff/copies/factions.json?from=&to=` list row fields (including
  `copied_to_target` and `name_taken_in_target`) and
  `POST staff/copies/factions/<id>.json` `{target}` (`links` with 0..1 entries), the
  pending-links query path (`faction__game`).
- **Cache**: `X-Cache-Clear` paths for the target's faction family, reusing
  `GameResourceCachePaths('factions')` (as the staff photo type does).
- **Frontend**: tab-specific row columns (checkbox, cover thumbnail/placeholder, name,
  "already copied" flag, "name already used" badge; no hidden badge).
- **Testing**: per-type backend and frontend cases.

The index `docs/agents/specs/game-content-copy.md` links the new page (replacing the plain
"Factions — #1556" entry). No code changes.
