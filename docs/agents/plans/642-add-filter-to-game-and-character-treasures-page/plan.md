# Plan: Add filter to game and character treasures page

Issue: [642-add-filter-to-game-and-character-treasures-page.md](../../issues/642-add-filter-to-game-and-character-treasures-page.md)

## Overview

`/#/treasures` already has a filter bar (game type, min value, max value, name), but the
game-scoped and character-scoped treasure pages (`/#/games/:game_slug/treasures`,
`/#/games/:game_slug/pcs/:id/treasures`, `/#/games/:game_slug/npcs/:id/treasures`) have no
filtering UI at all. Backend support behind those three pages is also a patchwork today:
`game_treasures` supports `max_value`/`search`, `game_treasures_all` (the DM/editor variant
of the game page) supports no filtering whatsoever, and the shared `character_treasures()`
(used by both the PC and NPC endpoints, and by the NPC `all.json` DM variant) only supports
`search`. This plan brings all of those endpoints to parity with the global one (minus
`game_type`, which doesn't apply once treasures are already scoped to a single game), renames
`search` to `name` for consistency, and reuses the existing `TreasureFilters` component on
the frontend with the game-type dropdown hidden.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

Query params accepted by all of the following endpoints (all optional, blank/invalid ignored
exactly like the existing global `treasures_list` endpoint):

- `min_value` (integer) — filters to `game_value >= min_value` (or `value` where there is no
  game-specific override, same coalescing already used for `max_value`/ordering).
- `max_value` (integer) — filters to `game_value <= max_value`.
- `name` (string) — case-insensitive substring match. **Replaces** the current `search` param.

`game_type` is intentionally **not** added to any of these endpoints — every one of them is
already scoped to a single game.

Endpoints gaining/changing filter support:

- `GET /games/<slug>/treasures.json` (`game_treasures`) — already has `max_value` and
  `search`; add `min_value`, rename `search` → `name`.
- `GET /games/<slug>/treasures/all.json` (`game_treasures_all`) — currently has **no**
  filtering at all; add `min_value`, `max_value`, `name`.
- `GET /games/<slug>/pcs/<id>/treasures.json` (`game_pc_treasures`, via shared
  `character_treasures()`) — currently only has `search`; add `min_value`, `max_value`,
  rename `search` → `name`.
- `GET /games/<slug>/npcs/<id>/treasures.json` (`game_npc_treasures`, same shared
  `character_treasures()`) — same change, inherited automatically once
  `character_treasures()` is updated.
- `GET /games/<slug>/npcs/<id>/treasures/all.json` (`game_npc_treasures_all`, same shared
  `character_treasures()`) — same change, inherited automatically.

Frontend must call these endpoints with `min_value`/`max_value`/`name` (never `search`) once
the backend change lands; in particular `CharacterClient#fetchTreasuresAllPage` (used for the
NPC DM "all" fetch path, a separate client from the generic `fetchIndex` used everywhere else)
currently builds its own query string with `search` and must be updated to send `name` and
pass through `min_value`/`max_value` too.

Frontend reuses the existing `TreasureFilters` component/helper/controller as-is, gaining a
prop to hide the `game_type` dropdown (and to omit `game_type` from the built query) on the
three scoped pages.
