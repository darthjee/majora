# Backend Plan: Add give treasures

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the four summary endpoints and their `{ "quantity": <int> }` shape described in
[plan.md](plan.md)'s "Shared contracts" section. Consumes nothing new from other agents — the
`treasure.single`/`acquire`/`acquireAll` endpoints this issue relies on already exist unchanged.

## Implementation Steps

### Step 1 — Add the shared `character_treasure_summary` helper

Add `backend/games/views/game/_treasure_summary.py`, mirroring `_item_summary.py`
(`backend/games/views/game/_item_summary.py`) closely but resolving via the already-stored
`CharacterTreasure.quantity` field instead of a `.count()`:

```python
def character_treasure_summary(request, game, character_id, treasure_id, npc, check_hidden):
    """Return {'quantity': <int>}, `character`'s CharacterTreasure.quantity for `treasure_id`."""
    character = _get_character_or_404(game, character_id, npc)
    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response
    treasure = _find_game_treasure(game, treasure_id)
    character_treasure = character.character_treasures.filter(treasure=treasure).first()
    quantity = character_treasure.quantity if character_treasure else 0
    return Response({'quantity': quantity})
```

Unlike item's version, there is no `count_hidden` parameter — `CharacterTreasure` has no `hidden`
flag of its own (only `GameTreasure.hidden`, at the catalog level, already gated separately by
`_find_game_treasure`'s hidden check — see `_treasure_exchange.py::_find_game_treasure`, reuse it
here rather than duplicating). Also add `check_treasure_summary_all_permission`, mirroring
`check_item_summary_all_permission` but scoped to `game_pc_treasure`/`game_npc_treasure`'s own
`restricted.create` tier — confirm the exact resource names against
`backend/games/permissions/config/game_pc_treasure/` and `game_npc_treasure/` (create if the
`endpoints.yml` `restricted.create` tier doesn't already exist there, mirroring
`game_pc_item`/`game_npc_item`'s).

### Step 2 — Add the four view files

Following `backend/games/views/game/pcs/detail/items/game_pc_item_summary.py` /
`game_pc_item_summary_all.py` and their npc counterparts exactly (same decorators — `@regular` +
`@skip_cache` on the public variants, `@restricted` on the `/all.json` variants; same
`AllowAny`/`CookieTokenAuthentication` wiring):

- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_summary.py`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_summary_all.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_summary.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_summary_all.py`

Export each from its `__init__.py` (`backend/games/views/game/pcs/detail/treasures/__init__.py`,
`.../npcs/detail/treasures/__init__.py`), then re-export through the chain up to
`backend/games/views/__init__.py`, mirroring how the item summary views are threaded through today
(`grep -rn game_pc_item_summary backend/games/views/__init__.py backend/games/views/game/__init__.py
backend/games/views/game/pcs/__init__.py` to confirm every intermediate file that needs an
addition).

### Step 3 — Wire the URLs

In `backend/games/urls/games.py`, add the four summary routes right after the existing treasure
acquire/buy/sell/remove block, mirroring the item summary block at lines 116-133 exactly:

```python
path(
    'games/<slug:game_slug>/treasures/<int:treasure_id>/pcs/<int:character_id>/summary.json',
    views.game_pc_treasure_summary,
    name='game-treasure-pc-summary',
),
path(
    'games/<slug:game_slug>/treasures/<int:treasure_id>/pcs/<int:character_id>/summary/all.json',
    views.game_pc_treasure_summary_all,
    name='game-treasure-pc-summary-all',
),
path(
    'games/<slug:game_slug>/treasures/<int:treasure_id>/npcs/<int:character_id>/summary.json',
    views.game_npc_treasure_summary,
    name='game-treasure-npc-summary',
),
path(
    'games/<slug:game_slug>/treasures/<int:treasure_id>/npcs/<int:character_id>/summary/all.json',
    views.game_npc_treasure_summary_all,
    name='game-treasure-npc-summary-all',
),
```

### Step 4 — Document the endpoints

Add a "Treasure quantity summary endpoints (issue #1001)" section to
`docs/agents/access-control/character-treasure.md`, mirroring
`character-item.md`'s "Item quantity summary endpoints (issue #827)" section (lines ~96-109) —
same table shape, same wording pattern, adjusted for the two differences: no `count_hidden`
concept, and the permission-tier resource names (`game_pc_treasure`/`game_npc_treasure` instead of
`game_pc_item`/`game_npc_item`).

### Step 5 — Tests

Add `backend/games/tests/views/game/pcs/detail/treasures/test_game_pc_treasure_summary.py` (+
`_all`) and the npc equivalents, mirroring the existing item summary tests' structure and
coverage (owns-none → `0`, owns-some → actual quantity, hidden-NPC 404 gate on the public variant,
permission-tier checks on the `/all.json` variant, `X-Skip-Cache` header present on both).

## Files to Change

- `backend/games/views/game/_treasure_summary.py` — new shared summary logic
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_summary.py` — new
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_summary_all.py` — new
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_summary.py` — new
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_summary_all.py` — new
- `backend/games/views/game/pcs/detail/treasures/__init__.py`,
  `.../npcs/detail/treasures/__init__.py`, and every intermediate `__init__.py` up to
  `backend/games/views/__init__.py` — export the four new views
- `backend/games/urls/games.py` — four new url patterns
- `docs/agents/access-control/character-treasure.md` — new summary-endpoints section
- `backend/games/tests/views/game/pcs/detail/treasures/` and
  `.../npcs/detail/treasures/` — new test files for the four views

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov` (CI job: `pytest_views_characters`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- No migration needed — `CharacterTreasure.quantity` already exists.
- No changes to `character_treasure_acquire`/`_acquire()` — already does everything the give flow
  needs.
- Flag the new endpoints for `security`/`data-access` review once implemented (new `AllowAny`
  routes reading per-character data) — out of scope for this plan itself, handled by the standard
  review pass.
