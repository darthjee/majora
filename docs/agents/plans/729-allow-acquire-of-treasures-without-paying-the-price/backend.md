# Backend Plan: Allow acquire of treasures without paying the price

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the six new endpoints and their exact request/response shapes documented in
[plan.md](plan.md)'s "Shared contracts" section — reusing `_TreasureExchangeSerializer` and
`CharacterTreasureExchangePermission` unchanged.

## Implementation Steps

### Step 1 — Add `character_treasure_acquire`/`character_treasure_remove` to `_treasure_exchange.py`

In `backend/games/views/game/_treasure_exchange.py`, add two new public entry points next to
`character_treasure_buy`/`character_treasure_sell` (lines 23-48), following the exact same
`_authorize_and_parse` → dispatch pattern:

```python
def character_treasure_acquire(request, game, character, allow_hidden=False):
    resolve_treasure = partial(_find_game_treasure, game, allow_hidden=allow_hidden)
    error_response, treasure, quantity = _authorize_and_parse(
        request, character, resolve_treasure,
    )
    if error_response:
        return error_response

    return _acquire(character, treasure, quantity, game)


def character_treasure_remove(request, game, character):
    error_response, treasure, quantity = _authorize_and_parse(
        request, character, _find_treasure_by_id,
    )
    if error_response:
        return error_response

    return _remove(character, treasure, quantity, game)
```

Then add `_acquire`/`_remove`, mirroring `_buy` (lines 117-144) and `_sell` (lines 162-185)
exactly minus the money math:

- `_acquire`: same locking (`_lock_character`, `_lock_game_treasure`), same
  `_capped_quantity`/stock-cap behavior, same `_resolve_value`/`total_value` recalculation,
  same `_record_acquired_units` bookkeeping — but skip the `cost`/`insufficient funds` check
  and skip `character.money -=`. Still return `{'quantity': ..., 'money': character.money,
  'acquired': acquired}` (money included but untouched, per the shared-contract response
  shape) — this means `_acquire` needs `character` locked/refetched even though its money
  isn't written, purely to report the current value back (reuse `_lock_character` as-is).
- `_remove`: same ownership lock (`_lock_character_treasure`), same `quantity > owned` 400
  check, same `total_value` recalculation, same `_release_acquired_units` bookkeeping — but
  skip `character.money +=`. Return `{'quantity': ..., 'money': character.money}`.

No changes needed to `_find_game_treasure`, `_find_treasure_by_id`, `_resolve_value`,
`_capped_quantity`, `_record_acquired_units`, `_release_acquired_units`, or the locking
helpers — all reused as-is.

### Step 2 — Add view factories in `_character_shared.py`

In `backend/games/views/game/_character_shared.py`, add `build_treasure_acquire_view`,
`build_treasure_acquire_all_view`, and `build_treasure_remove_view`, mirroring
`build_treasure_buy_view`/`build_treasure_buy_all_view`/`build_treasure_sell_view`
(lines 288-327) exactly — same `@_build_api_view(['POST'], AllowAny)` decorator, same
`get_object_or_404(Game, ...)` + `_get_character_or_404(...)` setup, same
`GameEditPermission.check` gate on the `_all` variant, just calling
`character_treasure_acquire`/`character_treasure_remove` instead. Import them from
`_treasure_exchange` in the existing import line (line 32).

### Step 3 — Add thin per-kind view wrapper files

Mirror `game_pc_treasure_buy.py`/`game_pc_treasure_buy_all.py`/`game_pc_treasure_sell.py`
(one-liners) with six new files:

- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_acquire.py`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_acquire_all.py`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_remove.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_acquire.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_acquire_all.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_remove.py`

Each is `game_{pc,npc}_treasure_{acquire,remove} = build_treasure_{...}_view(npc=<bool>)`,
exactly like the existing buy/sell wrappers.

### Step 4 — Wire up exports

Add the six new names to the import/`__all__` lists in these files, following the exact same
pattern already used for `game_pc_treasure_buy`/`game_npc_treasure_buy` etc.:

- `backend/games/views/game/pcs/detail/treasures/__init__.py`
- `backend/games/views/game/npcs/detail/treasures/__init__.py`
- `backend/games/views/game/pcs/__init__.py`
- `backend/games/views/game/npcs/__init__.py`
- `backend/games/views/game/__init__.py`
- `backend/games/views/__init__.py`

### Step 5 — Add routes

In `backend/games/urls/_character_routes.py`'s `_CHARACTER_ROUTES` list (lines 5-25), add
three new tuples next to the existing treasure routes:

```python
('/treasures/acquire.json', 'treasure_acquire'),
('/treasures/acquire/all.json', 'treasure_acquire_all'),
('/treasures/remove.json', 'treasure_remove'),
```

`build_character_urlpatterns` auto-generates both the `pcs`/`npcs` paths and the
`game-{pc,npc}-treasure-{acquire,acquire-all,remove}` route names from this list — no further
routing code needed.

### Step 6 — Backend tests

For each of the 6 new endpoints, add a test file mirroring the corresponding buy/sell test
file's structure and coverage (permission matrix: owner/DM/staff/unrelated-user/unauthenticated;
404s for unknown game/character/treasure/opposite-role-id; 400s for missing/zero quantity;
value recalculation via `GameTreasure.value` override; stock-cap capping; hidden-treasure
gate + the DM `/all.json` bypass for acquire):

- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasure_acquire_test.py`
  (mirror `game_pc_treasure_buy_test.py`, dropping money-specific assertions/tests like
  `test_insufficient_funds_returns_400`, keeping everything else — including the
  `TestGamePcTreasureBuyHiddenTreasure`-equivalent class for the regular endpoint's 404, plus
  new tests confirming the `/all.json` variant *does* return 200 for a hidden treasure)
- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasure_acquire_all_test.py`
  (mirror `game_pc_treasure_buy_all_test.py`)
- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasure_remove_test.py`
  (mirror `game_pc_treasure_sell_test.py`, dropping money-refund assertions)
- Same three, NPC equivalents, under `.../npcs/detail/treasures/`

## Files to Change

- `backend/games/views/game/_treasure_exchange.py` — add `character_treasure_acquire`,
  `character_treasure_remove`, `_acquire`, `_remove`
- `backend/games/views/game/_character_shared.py` — add three new view factories
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_{acquire,acquire_all,remove}.py` — new
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_{acquire,acquire_all,remove}.py` — new
- `backend/games/views/game/pcs/detail/treasures/__init__.py`,
  `backend/games/views/game/npcs/detail/treasures/__init__.py`,
  `backend/games/views/game/pcs/__init__.py`, `backend/games/views/game/npcs/__init__.py`,
  `backend/games/views/game/__init__.py`, `backend/games/views/__init__.py` — export wiring
- `backend/games/urls/_character_routes.py` — three new route tuples
- `backend/games/tests/views/game/{pcs,npcs}/detail/treasures/game_{pc,npc}_treasure_{acquire,acquire_all,remove}_test.py` — new, 6 files

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/game/` (CI job: `pytest_views_characters`)

## Notes

- No migration needed — no model/schema changes, purely new view/route/permission wiring
  reusing existing models (`Character`, `CharacterTreasure`, `GameTreasure`, `Treasure`).
- The proxy's cache-cleanup trigger routes (`proxy/extension/lib/configuration/cache_cleanup/`)
  also need the new routes added — that's the `proxy` agent's file, see [proxy.md](proxy.md).
