# Issue: Use the new game treasure value for filtering

## Description
On the endpoints related to game, PC, and NPC treasures, switch from using the default `Treasure.value` to the per-game `GameTreasure.value`. This affects both display/filtering/ordering on the treasure-listing endpoints, and cost calculation on the trade endpoints.

## Problem
`GameTreasure.value` already exists in the database as a per-game override of `Treasure.value` (added and backfilled via migrations `0055_gametreasure_value` / `0056_alter_gametreasure_value_not_null`, and populated on treasure creation), but no endpoint actually reads it yet. Display, filtering, ordering, and cost calculation all still read `Treasure.value` directly:
- `TreasureListSerializer` / `TreasureDetailSerializer` (`games/serializers/treasures/`) expose `value` straight from `Treasure`.
- The `max_value` filter and `ordering` param in `games/views/games/game_treasures.py` filter/order on `Treasure.value`.
- `CharacterTreasureSerializer` (`games/serializers/characters/character_treasure.py`) sources `value` from `treasure.value`, and ordering in `games/views/game/_treasures.py` orders by `treasure__value`. Neither the PC nor NPC treasures endpoint currently has a filter-by-value param.
- Acquire/sell cost calculation in `games/views/game/_treasure_exchange.py` multiplies quantity by `treasure.value` directly, even though the `GameTreasure` row for that game is already fetched for stock-cap purposes.

As a result, a DM cannot see any real effect from a different `GameTreasure.value` — every read and calculation path ignores it.

## Expected Behavior
- `GET /game/:game_slug/treasures.json` displays, filters (`max_value`), and orders treasures by `GameTreasure.value` instead of `Treasure.value`.
- `GET /game/:game_slug/pcs/:id/treasures.json` and `GET /game/:game_slug/npcs/:id/treasures.json` display and order treasures by `GameTreasure.value` instead of `Treasure.value`.
- `POST /game/:game_slug/pcs/:id/treasures/acquire.json` and `POST /game/:game_slug/npcs/:id/treasures/sell.json` calculate cost/refund using `GameTreasure.value` instead of `Treasure.value`.

## Solution
- Update `TreasureListSerializer` / `TreasureDetailSerializer` to source `value` from the game's `GameTreasure` row, reusing the existing `GameTreasureFieldsMixin` pattern already used for `available_units` / `max_units`.
- Update the `max_value` filter and `ordering` logic in `games/views/games/game_treasures.py` to filter/order on `GameTreasure.value`.
- Update `CharacterTreasureSerializer` to source `value` from `GameTreasure` instead of `treasure.value`, and update the ordering in `games/views/game/_treasures.py` accordingly.
- Update cost/refund calculation in `games/views/game/_treasure_exchange.py` (acquire and sell) to use the already-fetched `GameTreasure` row's `value` instead of `treasure.value`.

Out of scope: adding a DM-facing endpoint to edit `GameTreasure.value` per game — only `max_units` is currently editable via `GameTreasureUpdateSerializer`, and that remains a separate future issue.

## Benefits
Lets a DM set a different treasure value per game and have it actually take effect across display, filtering, ordering, and trading — delivering the feature `GameTreasure.value` was added for.
