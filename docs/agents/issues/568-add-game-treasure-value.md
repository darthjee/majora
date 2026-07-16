# Issue: Add game treasure value

## Description
Treasures have a `value`, but `GameTreasure` — the through-model linking a `Game` to a `Treasure` (`backend/games/models/game/game_treasure.py`) — has no `value` field of its own. Today, whenever a treasure's value is read in the context of a game, it always resolves to the shared `Treasure.value`; there is no per-game override.

Separately, `GameTreasure` rows are currently only ever created for **global/shared treasures** (`Treasure.game` is `None`) being linked into a game — lazily, via a `get_or_create` inside the `PATCH /games/<slug>/treasures/<treasure_id>.json` flow (`_update_linked_treasure`, `backend/games/views/games/game_treasure_detail.py`). Exclusive treasures (created via `POST /games/<slug>/treasures.json`, with `Treasure.game` set directly) never go through that code path — `_update_game_treasure` routes them to `_update_exclusive_treasure` instead, which only ever touches the `Treasure` row. As a result, no exclusive treasure currently has a `GameTreasure` row at all.

## Problem
There is currently no way to give a treasure a game-specific value. This blocks future work that wants to control a treasure's value at the game level, independent of the shared `Treasure.value`.

The lazy `GameTreasure` creation also means creation is implicit and scattered — it happens as a side effect of an edit endpoint rather than at the point a treasure actually becomes tied to a game. And because exclusive treasures never exercise that path, they have no `GameTreasure` row to hold a per-game value on.

## Solution
- Add a required (non-nullable) `IntegerField value` to `GameTreasure`.
- Update `POST /games/<slug>/treasures.json` (`_create_game_treasure` in `backend/games/views/games/game_treasures.py`), which creates a `Treasure` exclusive to the game, to also explicitly create the matching `GameTreasure` link row for it, with `value` set equal to the newly created `Treasure`'s `value`. This is new: exclusive treasures do not have a `GameTreasure` row today.
- Remove the lazy `get_or_create` in `_update_linked_treasure` (`backend/games/views/games/game_treasure_detail.py`, the branch of `PATCH /games/<slug>/treasures/<treasure_id>.json` used for global/shared treasures linked to a game) and replace it with a strict lookup: if no `GameTreasure` row exists for that `(game, treasure)` pair, return 404. Creation of the row is no longer this endpoint's responsibility — linking a new global treasure into a game (when there's no `GameTreasure` row yet) is left to the Django admin (`GameTreasureInline`, `backend/games/admin.py`), which already creates the row directly and is unaffected by this change.
- Migration:
  - Backfill `value` on all existing `GameTreasure` rows (today, only ones for previously-linked global treasures) with the `value` of the `Treasure` they link to.
  - Create a `GameTreasure` row (with `value` = the linked `Treasure`'s `value`) for every exclusive `Treasure` (`Treasure.game` set) — none of them have one yet, since that code path was previously unreachable for exclusive treasures. This keeps existing exclusive treasures consistent with newly-created ones, which get their `GameTreasure` row at creation time going forward.
  - Add `value` as nullable first, run the backfill, then alter the column to `NOT NULL`.
- `value` is a one-time snapshot taken at creation/migration time — it is intentionally **not** kept in sync afterward if the linked `Treasure.value` changes later (including when `_update_exclusive_treasure` updates an exclusive treasure's own `value`). The whole point is to allow a game-level override, controlled independently of the shared treasure's value.
- `value` is not exposed via any serializer or API response as part of this issue; no existing behavior around reading/using treasure value changes.

## Benefits
Prepares the data model so a future feature can use a per-game treasure value inside games, without changing any current behavior. Also makes `GameTreasure` creation explicit and predictable — always at the point a treasure becomes exclusive to (or is linked to) a game — instead of an implicit side effect of an edit endpoint, and makes exclusive and linked treasures consistent in always having a `GameTreasure` row.
