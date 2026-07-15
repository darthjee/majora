# Backend Plan: Add currency types

Main plan: [plan.md](plan.md)

## Shared contracts

- `Treasure.game_type` — `CharField(max_length=16, choices=Game.GAME_TYPE_CHOICES,
  default=Game.GAME_TYPE_DND)`. Reuses `Game`'s choices from #454 rather than duplicating
  them.
- `POST /games/<slug>/treasures.json` forces `game_type` to the owning game's type
  (client value ignored). `POST /treasures.json` accepts an optional `game_type` from the
  client (defaults to `dnd`).
- `TreasureDetailSerializer`/`TreasureListSerializer` expose `game_type`.
  `TreasureUpdateSerializer` is unchanged.

## Implementation Steps

### Step 1 — Add the field to the `Treasure` model

In `backend/games/models/treasure/treasure.py`, import `Game`
(`from games.models.game.game import Game`) and add:

```python
game_type = models.CharField(
    max_length=16, choices=Game.GAME_TYPE_CHOICES, default=Game.GAME_TYPE_DND
)
```

Place it near `value` (the other money-related field). Watch for an import-cycle risk —
`Game` doesn't currently import `Treasure` directly (only via the `treasures` M2M's
string reference `'Treasure'`), so a direct import should be safe, but verify with
`poetry run python manage.py check` after adding it.

### Step 2 — Migration

Add a migration (e.g. `backend/games/migrations/00XX_treasure_game_type.py`, numbered
after whatever #454's `Game.game_type` migration lands as) with a single `AddField`,
mirroring `0038_character_allegiance_character_public_allegiance.py`'s shape: same
`choices`/`default`/`max_length` as `Game.game_type`. Existing treasures backfill to
`dnd` automatically via the field default.

### Step 3 — `TreasureCreateSerializer`

In `backend/games/serializers/treasures/treasure_create.py`, add `'game_type'` to
`fields` with `extra_kwargs = {'game_type': {'required': False}}` (same treatment as
`Game.game_type` in #454's `GameCreateSerializer`).

### Step 4 — Force `game_type` on game-exclusive treasure creation

In `backend/games/views/games/game_treasures.py`'s `_create_game_treasure`, change
`treasure = serializer.save(game=game)` to
`treasure = serializer.save(game=game, game_type=game.game_type)` — this overrides
whatever the client sent (or omitted), so the game-scoped creation form never needs to
expose a type picker.

### Step 5 — Detail/list serializers

Add `'game_type'` to `fields` in both
`backend/games/serializers/treasures/treasure_detail.py` and
`backend/games/serializers/treasures/treasure_list.py`.

### Step 6 — Tests

- `backend/games/tests/serializers/treasures/treasure_create_test.py` (or equivalent):
  standalone creation defaults to `dnd` when omitted, and persists an explicit
  `game_type='deadlands'`.
- `backend/games/tests/views/games/game_treasures_test.py` (or equivalent, under
  `games/tests/views/games/`): creating a treasure inside a `deadlands` game yields
  `game_type='deadlands'` on the created treasure even if the request body sends
  `game_type='dnd'` (or omits it) — asserts the override, not just the happy path.
- `treasure_detail_test.py` / `treasure_list_test.py` (serializer + view levels): assert
  `game_type` appears in the response.
- Confirm no existing test/factory hardcodes `Treasure`'s full field list in a way that
  would break once `game_type` is added (same class of check as `GameFactory` in #454).

## CI Checks

- `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers `games/tests/views/games/game_treasures_test.py` and `games/tests/views/treasures/`

## Notes

- Do not add `game_type` to `TreasureUpdateSerializer` — the issue is explicit that
  treasure type has no edit path for now.
- `Character.money` needs no backend change — currency type for character money is
  resolved entirely on the frontend from the character's own game, so there's nothing to
  add to `Character`, `CharacterDetailSerializer`, or `CharacterListSerializer` here.
