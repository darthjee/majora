# Plan: Add character treasure value

Issue: [564_add-character-treasure-value.md](../../issues/564-add-character-treasure-value.md)

## Overview
Add a `total_value` field to `CharacterTreasure` that snapshots `quantity * value` (the same effective value already resolved by the treasure exchange logic: `GameTreasure.value` when a `GameTreasure` row exists for the game/treasure pair, otherwise `Treasure.value`). The field is set whenever `quantity` changes via acquire/sell, and existing rows are backfilled by the migration. It is DB-only for now — not exposed in any response, serializer, or calculation.

## Context
`CharacterTreasure` (`backend/games/models/character/character_treasure.py`) currently only tracks `quantity`. `GameTreasure.value` can change later (it mirrors edits to the linked `Treasure.value`, see `game_treasure_detail.py`), so there is no way to recover the value that applied at the time of a past acquire/sell. The quantity mutations happen in `backend/games/views/game/_treasure_exchange.py`'s `_acquire()` (line ~106-108) and `_sell()` (line ~146-147), each of which already resolves the effective `value` (`treasure.value if game_treasure is None else game_treasure.value`) a few lines earlier in the same function — that's the value to reuse.

## Implementation Steps

### Step 1 — Add `total_value` field to `CharacterTreasure`
In `backend/games/models/character/character_treasure.py`, add `total_value = models.PositiveIntegerField(default=0)` after `quantity`.

### Step 2 — Migration with backfill
Create a new migration (`backend/games/migrations/0057_charactertreasure_total_value.py`, next number after `0056_alter_gametreasure_value_not_null.py`) that:
- Adds `total_value` (matching Step 1's field).
- Backfills existing rows via `RunPython`, following the exact pattern used in `0055_gametreasure_value.py`'s `_backfill_gametreasure_value`: for each `CharacterTreasure`, resolve `game_treasure = GameTreasure.objects.filter(game=character_treasure.character.game, treasure=character_treasure.treasure).first()`, then `value = character_treasure.treasure.value if game_treasure is None else game_treasure.value`, and set `total_value = character_treasure.quantity * value`. Use `select_related('character', 'treasure')` for efficiency. Reverse migration is a no-op (`AddField` reversal handles cleanup), same as `0055`.

### Step 3 — Set `total_value` on acquire/sell
In `backend/games/views/game/_treasure_exchange.py`:
- `_acquire()`: right after `character_treasure.quantity += acquired` / before `.save()`, add `character_treasure.total_value = character_treasure.quantity * value` (reusing the `value` local already computed at line 101).
- `_sell()`: right after `character_treasure.quantity -= quantity` / before `.save()`, add `character_treasure.total_value = character_treasure.quantity * value`. Note `value` in `_sell()` is currently resolved *after* the quantity update (line 150, from `game_treasure` locked at line 149) — reorder so `game_treasure`/`value` are resolved before updating `quantity`/`total_value`, then save once with both fields updated (keep a single `.save()` call, or add `update_fields=['quantity', 'total_value']` if `.save()` is split).
- Do not add `total_value` to either endpoint's `Response(...)` payload — it stays DB-only per the issue.

## Files to Change
- `backend/games/models/character/character_treasure.py` — add `total_value` field.
- `backend/games/migrations/0057_charactertreasure_total_value.py` — new migration, adds field + backfills existing rows.
- `backend/games/views/game/_treasure_exchange.py` — set `total_value` alongside `quantity` in `_acquire()` and `_sell()`.
- `backend/games/tests/models/character/character_treasure_test.py` — cover the new field's default.
- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasure_acquire_test.py` and `game_pc_treasure_sell_test.py` — assert `CharacterTreasure.total_value` after acquire/sell (mirroring the existing `test_acquire_creates_character_treasure_row`-style assertions), including a case where `GameTreasure.value` differs from `Treasure.value`.
- `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasure_acquire_test.py` and `game_npc_treasure_sell_test.py` — same coverage for NPCs.

## CI Checks
- `backend/games/tests/views/game/`: `docker-compose run --rm majora_tests pytest games/tests/views/game/` (CI job: `pytest_views_characters`)
- `backend/games/tests/models/`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/` (CI job: `pytest_all`)

## Notes
- `_sell()`'s value resolution needs reordering (see Step 3) so `total_value` can be computed before/alongside the `quantity` save without a second DB write — a minor refactor within the existing atomic block, no behavior change to the money refund logic.
- The migration's backfill query mirrors `0055_gametreasure_value.py`'s `_backfill_existing_rows` pattern for consistency with this codebase's established convention for denormalized-field backfills.
