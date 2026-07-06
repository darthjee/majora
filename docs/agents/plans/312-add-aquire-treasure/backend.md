# Backend Plan: Add acquire treasure

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section in full — this file implements all of
it from the backend side: the two new `CharacterTreasureSerializer` fields, the
`quantity__gt=0` filtering on `game_pc_treasures`/`game_npc_treasures`, the four new
acquire/sell endpoints, and the `max_value` query param on `game_treasures`.

## Implementation Steps

### Step 1 — Extend `CharacterTreasureSerializer`

`source/games/serializers/character_treasure.py`: add `treasure_id` (`IntegerField`,
`source='treasure.id'`, read-only) and `photo_path` (`CharField`, `source='treasure.photo.path'`,
`default=None`, read-only), matching the pattern already used by `TreasureListSerializer`
(`source/games/serializers/treasure_list.py`) for `photo_path`. Add both to `Meta.fields`.
Update `source/games/tests/serializers/test_character_treasure.py` with tests for both new
fields, including the `photo_path=None` case when the treasure has no photo.

### Step 2 — Filter owned-treasure lists to `quantity > 0`

In `source/games/views/characters/game_pc_treasures.py` and `game_npc_treasures.py`, change
`character.character_treasures.select_related('treasure').all()` to
`.filter(quantity__gt=0)`. Update
`source/games/tests/views/characters/game_pc_treasures_test.py` and
`game_npc_treasures_test.py` to assert a zero-quantity `CharacterTreasure` row is excluded
from the response.

### Step 3 — `max_value` filter on `game_treasures`

In `source/games/views/games/game_treasures.py`, read an optional `max_value` query param
(`request.GET.get('max_value')`); when present and a valid integer, add
`.filter(value__lte=max_value)` to the queryset before pagination. Invalid/non-numeric
values should be ignored (treat as absent) rather than erroring, since this is a
browsing/UX filter, not a validated write. Add tests to
`source/games/tests/views/games/game_treasures_test.py` covering: filter applied, filter
absent, and a non-numeric value being ignored.

### Step 4 — Acquire/sell endpoints

Add a shared implementation (new module
`source/games/views/characters/_treasure_exchange.py`, mirroring the existing
`_slain_set.py` shared-helper pattern, and reusing `_find_character` from
`source/games/views/characters/_shared.py`) used by four thin PC/NPC view functions, one
per action:

- `source/games/views/characters/game_pc_treasure_acquire.py`
- `source/games/views/characters/game_pc_treasure_sell.py`
- `source/games/views/characters/game_npc_treasure_acquire.py`
- `source/games/views/characters/game_npc_treasure_sell.py`

Each: `@api_view(['POST'])`, `CookieTokenAuthentication`, resolves `game` (404 via
`get_object_or_404`) and `character` via `_find_character(game, character_id, npc=False|True)`
(`Http404` if `None`, respecting the existing `npc=False`/`npc=True` split), then delegates
to the shared helper with the character, request, and `treasure`-scoping game.

Shared helper (`_treasure_exchange.py`) behavior, one function per action
(`character_treasure_acquire(request, game, character)` /
`character_treasure_sell(request, game, character)`):

1. `CharacterEditPermission.check(request, character)` — return its error response if any
   (401/403).
2. Validate `treasure_id` and `quantity` from `request.data` (a small `serializers.Serializer`
   with `treasure_id = IntegerField()` and `quantity = IntegerField(min_value=1)` is enough;
   route through `validated_or_error` for the standard 400 shape).
3. Resolve the `Treasure`, scoped to this game via the same
   `Q(linked_game=game) | Q(game=game)` filter used in `game_treasures.py` — raise
   `Http404` if the treasure isn't available in this game.
4. Inside `transaction.atomic()`:
   - **acquire**: `get_or_create` the `CharacterTreasure(character=character, treasure=treasure)`
     row (default `quantity=0`); compute `cost = quantity * treasure.value`; if
     `cost > character.money`, return a 400 `{'errors': {'quantity': ['insufficient funds']}}`;
     otherwise `character_treasure.quantity += quantity`, `character.money -= cost`, save both.
   - **sell**: fetch the existing `CharacterTreasure` row (`Http404` if none, since selling
     something never owned isn't a validation error but a not-found); if
     `quantity > character_treasure.quantity`, return a 400
     `{'errors': {'quantity': ['not enough owned']}}`; otherwise subtract `quantity`
     from the row and add `quantity * treasure.value` to `character.money`, save both
     (row is kept even at 0 — never deleted).
5. Return `Response({'quantity': character_treasure.quantity, 'money': character.money})`.

Wire the four new views into `source/games/urls.py` right after the existing
`game-pc-treasures`/`game-npc-treasures` entries, e.g.:

```python
path(
    'games/<slug:game_slug>/pcs/<int:character_id>/treasures/acquire.json',
    views.game_pc_treasure_acquire,
    name='game-pc-treasure-acquire',
),
path(
    'games/<slug:game_slug>/pcs/<int:character_id>/treasures/sell.json',
    views.game_pc_treasure_sell,
    name='game-pc-treasure-sell',
),
# ...and the npc equivalents (game-npc-treasure-acquire / game-npc-treasure-sell)
```

Export the new views from `source/games/views/characters/__init__.py` and
`source/games/views/__init__.py` following the existing export pattern.

Write tests under `source/games/tests/views/characters/` (new files per endpoint, mirroring
`game_pc_treasures_test.py`'s structure) covering: success (money and quantity updated
correctly, row created on first acquire, row kept at 0 after full sell), insufficient
funds, over-selling, unauthenticated (401), authenticated-but-not-permitted (403), treasure
not belonging to the game (404), and PC/NPC + hidden-NPC parity with the existing
detail/access endpoints.

## Files to Change

- `source/games/serializers/character_treasure.py` — add `treasure_id`, `photo_path`
- `source/games/tests/serializers/test_character_treasure.py` — cover new fields
- `source/games/views/characters/game_pc_treasures.py` — filter `quantity__gt=0`
- `source/games/views/characters/game_npc_treasures.py` — filter `quantity__gt=0`
- `source/games/tests/views/characters/game_pc_treasures_test.py` — zero-quantity exclusion
- `source/games/tests/views/characters/game_npc_treasures_test.py` — zero-quantity exclusion
- `source/games/views/games/game_treasures.py` — `max_value` query param
- `source/games/tests/views/games/game_treasures_test.py` — cover `max_value`
- `source/games/views/characters/_treasure_exchange.py` (new) — shared acquire/sell logic
- `source/games/views/characters/game_pc_treasure_acquire.py` (new)
- `source/games/views/characters/game_pc_treasure_sell.py` (new)
- `source/games/views/characters/game_npc_treasure_acquire.py` (new)
- `source/games/views/characters/game_npc_treasure_sell.py` (new)
- `source/games/views/characters/__init__.py` — export new views
- `source/games/views/__init__.py` — export new views
- `source/games/urls.py` — register the four new routes
- `source/games/tests/views/characters/` (new test files) — acquire/sell coverage

## CI Checks

- `source`: `docker-compose run --rm backend pytest` (CI job: backend tests, see
  `.circleci/config.yml`)
- `source`: `docker-compose run --rm backend flake8` (or the project's configured lint job,
  if separate — check `.circleci/config.yml` for the exact command)

## Notes

- Do not delete `CharacterTreasure` rows on full sell-off — required by the issue to
  preserve history.
- `character.money` and `treasure.value` are both already in copper pieces (per #311); no
  unit conversion is needed in the exchange math.
- After this work, the architect will dispatch `data-access` and `security` review (new
  endpoints + serializer field changes) before the PR is finalized — no action needed here
  beyond following existing permission/authentication patterns.
