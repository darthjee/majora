# Backend Plan: Add game types

Main plan: [plan.md](plan.md)

## Shared contracts

- Add `Game.game_type` (`CharField(max_length=16, choices=GAME_TYPE_CHOICES, default=GAME_TYPE_DND)`)
  with constants `GAME_TYPE_DND = 'dnd'`, `GAME_TYPE_DEADLANDS = 'deadlands'`, mirroring
  `Character.ALLEGIANCE_*` (`backend/games/models/character/character.py:14-22`).
- `GameCreateSerializer` gains `game_type` as an optional field (`required: False`, same
  as `description` today) — omitted payloads fall back to the model default `dnd`.
- `GameDetailSerializer` gains `game_type` in its `fields` list, returned as the raw DB
  value. `GameUpdateSerializer` and `GameListSerializer` are left unchanged.

## Implementation Steps

### Step 1 — Add the field to the `Game` model

In `backend/games/models/game/game.py`, add class-level constants and a `GAME_TYPE_CHOICES`
list, then the field itself, following the exact shape of `Character.allegiance`
(`backend/games/models/character/character.py:14-22,40-42`):

```python
GAME_TYPE_DND = 'dnd'
GAME_TYPE_DEADLANDS = 'deadlands'

GAME_TYPE_CHOICES = [
    (GAME_TYPE_DND, 'D&D'),
    (GAME_TYPE_DEADLANDS, 'Deadlands'),
]

game_type = models.CharField(
    max_length=16, choices=GAME_TYPE_CHOICES, default=GAME_TYPE_DND
)
```

Place the constants above `name` (matching where `Character` declares `ALLEGIANCE_*`
before its own fields) and the field itself near the other simple fields (e.g. after
`description`).

### Step 2 — Migration

Generate (`poetry run python manage.py makemigrations games`) or hand-write a migration
`backend/games/migrations/0044_game_game_type.py` following
`0038_character_allegiance_character_public_allegiance.py`'s shape exactly: a single
`AddField` with `choices=[('dnd', 'D&D'), ('deadlands', 'Deadlands')]`, `default='dnd'`,
`max_length=16`. Since it's a plain `AddField` with a default, no data migration or
`RunPython` is needed — existing rows are backfilled with `dnd` automatically.

### Step 3 — Update `GameCreateSerializer`

In `backend/games/serializers/games/game_create.py`, add `'game_type'` to `fields` and
`'game_type': {'required': False}` to `extra_kwargs` (same treatment as `description`).

### Step 4 — Update `GameDetailSerializer`

In `backend/games/serializers/games/game_detail.py`, add `'game_type'` to the `fields`
list (no custom serializer field needed — it's a plain model attribute, same as `name`/
`game_slug`/`description`).

### Step 5 — Tests

- `backend/games/tests/serializers/games/game_create_test.py`: assert a game created
  without `game_type` defaults to `dnd`, and that passing `game_type='deadlands'`
  persists it.
- `backend/games/tests/serializers/games/game_detail_test.py`: assert `game_type` is
  present in the serialized output.
- `backend/games/tests/views/games/game_detail_test.py`: assert the detail endpoint
  response includes `game_type`.
- `backend/games/tests/models/game/game_test.py`: assert the model default is `dnd` when
  no `game_type` is given at creation (mirrors how `Character`'s default `allegiance` is
  exercised, if such a model-level default assertion pattern exists there — otherwise a
  new simple test is fine).
- Check whether a `GameFactory` (or similar) exists under `backend/games/tests/` and
  whether it needs a `game_type` default/trait added for other tests that construct games
  incidentally — it shouldn't need changes since the model default already covers the
  no-argument case, but confirm no factory hardcodes the full field list.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)

## Notes

- Do not add `game_type` to `GameUpdateSerializer` or `GameListSerializer` — the issue
  fixes the type at creation and doesn't require it in list views.
- `GAME_TYPE_CHOICES` labels (`'D&D'`, `'Deadlands'`) only surface in Django admin/DRF's
  browsable API, not in the actual frontend UI — the frontend hardcodes its own labels
  per the shared contract, so keep these in sync by eye but there's no runtime coupling.
