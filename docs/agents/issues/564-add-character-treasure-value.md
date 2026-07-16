# Issue: Add character treasure value

## Description
When a character acquires or sells a treasure, the `CharacterTreasure` entity should keep a snapshot of the treasure's total value at that moment.

This value is only being stored for now — it is not used in any calculation or displayed anywhere yet. It is intended to support future features.

## Problem
`CharacterTreasure` currently only tracks `quantity`. There is no persisted record of how much a character's held treasures were worth at the time they were acquired or sold. Since `GameTreasure.value` can change later (it mirrors edits made to the linked `Treasure.value`), there is no way to recover the value that applied at the time of a past transaction.

## Expected Behavior
After every acquire or sell operation on a `CharacterTreasure`, its `total_value` field reflects `quantity * value` using the same effective value already resolved by the exchange logic (`GameTreasure.value` when a `GameTreasure` row exists for the game/treasure pair, otherwise `Treasure.value`), computed right after `quantity` is updated.

## Solution
- Add a `total_value` field to `CharacterTreasure`, with a migration that also backfills existing rows (`quantity * value`, using `GameTreasure.value` when a `GameTreasure` row exists for the game/treasure pair, otherwise `Treasure.value`).
- In `backend/games/views/game/_treasure_exchange.py`, after `character_treasure.quantity` is updated and saved in both `_acquire()` and `_sell()`, also set and save `character_treasure.total_value = character_treasure.quantity * value`, reusing the `value` variable already resolved in each function.
- The field is DB-only for now — it is not added to the acquire/sell endpoint responses, nor to any serializer or calculation.

## Benefits
Lays the groundwork for future features (e.g. reporting the value of treasures a character holds/held) without needing to reconstruct historical `GameTreasure` values, which can change over time.
