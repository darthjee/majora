# Backend Plan: Refactor treasure exchange modal

Main plan: [plan.md](plan.md)

## Shared contracts

- Produces the renamed endpoints `POST /games/:game_slug/{pcs,npcs}/:id/treasures/buy.json` and `.../treasures/buy/all.json` (was `acquire`/`acquire/all`), route names `game-{pc,npc}-treasure-buy(-all)`. `sell.json` is unchanged.
- Response shapes are **unchanged**: buy → `{quantity, money, acquired}`, sell → `{quantity, money}`, validation error → `{errors: {quantity: [...]}}`. No change in business logic.
- `GameTreasure.acquired_units` and the `acquired` response field keep their current names — do **not** rename these; only the action/endpoint naming changes.
- `CharacterTreasureExchangePermission` and `_TreasureExchangeSerializer` are already named generically (not "acquire") and need no renaming.

## Implementation Steps

### Step 1 — Rename the route table entries

In `backend/games/urls/_character_routes.py`, rename the two `_CHARACTER_ROUTES` tuples:

```python
('/treasures/buy.json', 'treasure_buy'),
('/treasures/buy/all.json', 'treasure_buy_all'),
```

(was `('/treasures/acquire.json', 'treasure_acquire')` / `('/treasures/acquire/all.json', 'treasure_acquire_all')`). Since the view attribute name is derived as `game_{kind}_{name_suffix}` and the route name as `game-{kind}-{name_suffix-with-dashes}`, this single change also renames the resolved view attribute Django looks up (`game_pc_treasure_buy`, `game_npc_treasure_buy_all`, etc.) and the route name (`game-pc-treasure-buy`, ...) — so it must land together with Step 2, or routing breaks.

### Step 2 — Rename the view module files and their exported names

For each of the 4 view modules under `backend/games/views/game/{pcs,npcs}/detail/treasures/`:

- `game_pc_treasure_acquire.py` → `game_pc_treasure_buy.py`, exported name `game_pc_treasure_acquire` → `game_pc_treasure_buy`
- `game_pc_treasure_acquire_all.py` → `game_pc_treasure_buy_all.py`, exported name likewise
- `game_npc_treasure_acquire.py` → `game_npc_treasure_buy.py`, exported name likewise
- `game_npc_treasure_acquire_all.py` → `game_npc_treasure_buy_all.py`, exported name likewise

Each file's single line becomes e.g. `game_pc_treasure_buy = build_treasure_acquire_view(npc=False)` — note the **factory function itself** (`build_treasure_acquire_view`/`build_treasure_acquire_all_view` in `_character_shared.py`) can keep its current name or be renamed to `build_treasure_buy_view`/`build_treasure_buy_all_view` for consistency; prefer renaming it too since this issue's rename is meant to be thorough, but keep `character_treasure_acquire`/`character_treasure_sell` in `_treasure_exchange.py` — actually rename `character_treasure_acquire` to `character_treasure_buy` as well (its docstring/module docstring in `_treasure_exchange.py` also says "acquire" and should follow).

Update the docstrings mentioning "acquire" (e.g. "Spend a PC's/NPC's money to acquire a quantity" → "... to buy a quantity") in `_character_shared.py` and `_treasure_exchange.py` to match.

### Step 3 — Update re-exports

Update the `__init__.py` files that re-export these names:

- `backend/games/views/game/pcs/detail/treasures/__init__.py` and the `npcs` equivalent — update the module docstring ("list, acquire, sell" → "list, buy, sell").
- `backend/games/views/game/__init__.py` and `backend/games/views/__init__.py` — rename the imported names and `__all__` entries (`game_pc_treasure_acquire` → `game_pc_treasure_buy`, etc., for all 4 names × both files).

### Step 4 — Rename backend tests

Rename and update the 4 view test files (mirroring the view tree under `backend/games/tests/views/game/{pcs,npcs}/detail/treasures/`):

- `game_pc_treasure_acquire_test.py` → `game_pc_treasure_buy_test.py`
- `game_pc_treasure_acquire_all_test.py` → `game_pc_treasure_buy_all_test.py`
- `game_npc_treasure_acquire_test.py` → `game_npc_treasure_buy_test.py`
- `game_npc_treasure_acquire_all_test.py` → `game_npc_treasure_buy_all_test.py`

Update every URL reverse-lookup / route-name reference inside them (`game-pc-treasure-acquire` → `game-pc-treasure-buy`, etc.) and any test/class/method names containing "acquire". Leave assertions about the `acquired`/`acquired_units` response/model fields untouched — those keep their names.

### Step 5 — Sweep for any remaining "acquire" references

Grep `backend/` for `acquire` after the above and confirm nothing renameable is left outside `acquired_units`/`acquired` (model field, serializer field, response key) and any historical/migration-adjacent code that must not change (migrations are immutable — do not touch existing migration files even if they reference `acquire` in a comment).

## Files to Change

- `backend/games/urls/_character_routes.py` — rename route path/name entries.
- `backend/games/views/game/_character_shared.py` — rename `build_treasure_acquire_view`/`build_treasure_acquire_all_view` (optional but preferred) and their docstrings.
- `backend/games/views/game/_treasure_exchange.py` — rename `character_treasure_acquire` → `character_treasure_buy`, update docstrings.
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_acquire.py` → `game_pc_treasure_buy.py`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_acquire_all.py` → `game_pc_treasure_buy_all.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_acquire.py` → `game_npc_treasure_buy.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_acquire_all.py` → `game_npc_treasure_buy_all.py`
- `backend/games/views/game/pcs/detail/treasures/__init__.py`, `backend/games/views/game/npcs/detail/treasures/__init__.py` — docstring update.
- `backend/games/views/game/__init__.py`, `backend/games/views/__init__.py` — rename imports/`__all__` entries.
- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasure_acquire_test.py` → `game_pc_treasure_buy_test.py`
- `backend/games/tests/views/game/pcs/detail/treasures/game_pc_treasure_acquire_all_test.py` → `game_pc_treasure_buy_all_test.py`
- `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasure_acquire_test.py` → `game_npc_treasure_buy_test.py`
- `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasure_acquire_all_test.py` → `game_npc_treasure_buy_all_test.py`
- `docs/agents/access-control/*.md` referencing the `acquire` endpoint (e.g. `character-treasure.md`, `character.md`, `treasure.md`) — update the endpoint name/path for consistency.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/game/` (CI job: `pytest_views_characters`) — covers the renamed PC/NPC treasure view tests.
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`) — catches any leftover unrenamed reference or import.

## Notes

- No new endpoint, permission, or serializer field is introduced — this is a pure rename with no logic change, so `data-access`/`security`/`product-owner` review isn't expected to surface anything backend-side.
- Double-check the `docs/agents/access-control/*.md` files after the rename — they document the endpoint by name and will drift out of sync with the code otherwise.
