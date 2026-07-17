# Issue: Add filter to game and character treasures page

## Problem
The treasures page (`/#/treasures`) has filters (game type, min value, max value, name), but the following pages don't have any filtering UI at all:
- Game treasures: `/#/games/:game_slug/treasures`
- PC treasures: `/#/games/:game_slug/pcs/:id/treasures`
- NPC treasures: `/#/games/:game_slug/npcs/:id/treasures`

Backend support is also inconsistent today:
- `game_treasures` endpoint (`games/<slug>/treasures.json`) supports `max_value` and `search` (name substring), but not `min_value`.
- PC/NPC endpoints (`games/<slug>/pcs/<id>/treasures.json`, `games/<slug>/npcs/<id>/treasures.json`, sharing `character_treasures()`) only support `search`, missing `min_value` and `max_value` entirely.
- The name filter param is called `search` on these three endpoints, but `name` on the global endpoint.

## Expected Behavior
All three pages above should offer the same filters available on `/#/treasures` — min value, max value, and name — with the exception of `game_type` (not applicable since these pages are already scoped to a single game).
Filter query params should be consistently named across all endpoints (`name` instead of `search`).

## Solution
- Backend: bring all three endpoints to parity with the global `treasures_list` endpoint (minus `game_type`):
  - Add `min_value` support to `game_treasures` and to the shared `character_treasures()` (used by both PC and NPC endpoints).
  - Add `max_value` support to `character_treasures()`.
  - Rename the existing `search` param to `name` on `game_treasures` and `character_treasures()` for consistency with the global endpoint.
- Frontend: reuse the existing `TreasureFilters` component (and its helper/controller) on all three pages, conditionally hiding the `game_type` dropdown since these pages are already scoped to one game:
  - `/#/games/:game_slug/treasures` (`GameTreasures.jsx`)
  - `/#/games/:game_slug/pcs/:id/treasures` (shared `CharacterTreasures.jsx`)
  - `/#/games/:game_slug/npcs/:id/treasures` (shared `CharacterTreasures.jsx`)

## Benefits
- Consistent filtering experience and query param naming across all treasure list pages/endpoints.
- Users can quickly narrow down treasures when viewing them scoped to a game, PC, or NPC.
