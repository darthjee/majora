# Extract `_treasure_finder.py` from `_treasure_exchange.py`

Move the treasure lookup helpers out of `backend/games/views/game/_treasure_exchange.py` (297 lines) into a new `_treasure_finder.py`, leaving all buy/sell/acquire/remove exchange logic in place. `_is_hidden` has no other caller besides `_find_game_treasure` and must move with it, not stay behind.

## Files to Change

- `backend/games/views/game/_treasure_finder.py` (new, ~40 lines) — `_find_game_treasure(game, treasure_id, allow_hidden=False)`, `_find_treasure_by_id(treasure_id)`, `_is_hidden(treasure)`. Imports `Treasure` from `...models`, `Http404` from `django.http`.
- `backend/games/views/game/_treasure_exchange.py` (reduced, ~260 lines) — keep entry points `character_treasure_buy`, `character_treasure_sell`, `character_treasure_acquire`, `character_treasure_remove`; internal helpers `_authorize_and_parse`, `_buy`, `_sell`, `_acquire`, `_remove`, `_capped_quantity`, `_record_acquired_units`, `_release_acquired_units`, `_lock_game_treasure`, `_lock_character`, `_lock_character_treasure`, `_lock_or_create_character_treasure`, `_resolve_value`; `_TreasureExchangeSerializer`. Add import of `_find_game_treasure`, `_find_treasure_by_id` from `_treasure_finder.py`.
