# Issue: Add game treasure value

## Description
Treasures have a `value`, but `GameTreasure` — the through-model linking a `Game` to a `Treasure` (`backend/games/models/game/game_treasure.py`) — has no `value` field of its own. Today, whenever a treasure's value is read in the context of a game, it always resolves to the shared `Treasure.value`; there is no per-game override.

Separately, `GameTreasure` rows are currently only ever created lazily, via a `get_or_create` inside the `PATCH /games/<slug>/treasures/<treasure_id>.json` flow (`_update_linked_treasure`, `backend/games/views/games/game_treasure_detail.py`). This means an exclusive treasure (created via `POST /games/<slug>/treasures.json`) has no `GameTreasure` row until a DM happens to edit it for the first time.

## Problem
There is currently no way to give a treasure a game-specific value. This blocks future work that wants to control a treasure's value at the game level, independent of the shared `Treasure.value`.

The lazy `GameTreasure` creation also means creation is implicit and scattered — it happens as a side effect of an edit endpoint rather than at the point a treasure actually becomes tied to a game.

## Solution
- Add a required (non-nullable) `IntegerField value` to `GameTreasure`.
- Update `POST /games/<slug>/treasures.json` (`_create_game_treasure` in `backend/games/views/games/game_treasures.py`), which creates a `Treasure` exclusive to the game, to also explicitly create the matching `GameTreasure` link row for it, with `value` set equal to the newly created `Treasure`'s `value`.
- Remove the lazy `get_or_create` in `_update_linked_treasure` (`backend/games/views/games/game_treasure_detail.py`, used by `PATCH /games/<slug>/treasures/<treasure_id>.json`) and replace it with a strict lookup: if no `GameTreasure` row exists for that `(game, treasure)` pair, return 404. Creation of the row is no longer this endpoint's responsibility.
- Migration:
  - Backfill `value` on all existing `GameTreasure` rows with the `value` of the `Treasure` they link to.
  - Backfill a missing `GameTreasure` row (with `value` = the linked `Treasure`'s `value`) for every exclusive `Treasure` (`Treasure.game` set) that doesn't have one yet — needed because, before this change, the row was only created lazily on first edit, so old unedited exclusive treasures currently have none. Without this, they would start 404ing on `PATCH .../treasures/<treasure_id>.json` once the lazy creation is removed.
  - Add `value` as nullable first, run the backfill, then alter the column to `NOT NULL`.
- `value` is a one-time snapshot taken at creation/migration time — it is intentionally **not** kept in sync afterward if the linked `Treasure.value` changes later. The whole point is to allow a game-level override, controlled independently of the shared treasure's value.
- `value` is not exposed via any serializer or API response as part of this issue; no existing behavior around reading/using treasure value changes.

## Benefits
Prepares the data model so a future feature can use a per-game treasure value inside games, without changing any current behavior. Also makes `GameTreasure` creation explicit and predictable, instead of an implicit side effect of an edit endpoint.
