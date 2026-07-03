# Backend Plan: Add money to character

Main plan: [plan.md](plan.md)

## Shared contracts

- New model field `Character.money = models.PositiveIntegerField(default=0)`. DRF derives
  `min_value=0` automatically from the model field's built-in `MinValueValidator`, so no
  extra serializer-level validator is needed.
- `money` is added (read) to `CharacterDetailSerializer.Meta.fields` — `CharacterFullSerializer`
  inherits it automatically. It is **not** added to `CharacterListSerializer`.
- `money` is added (write, `required: False`) to `CharacterUpdateSerializer.Meta.fields`.

## Implementation Steps

### Step 1 — Model field

In `source/games/models/character.py`, add:

```python
money = models.PositiveIntegerField(default=0)
```

Place it near the other simple scalar fields (e.g. after `hidden`). Generate the migration:

```
docker-compose run majora_app poetry run python manage.py makemigrations games
```

(Resolve the exact service/command by checking `docker-compose.yml` and
`source/majora_project/` — mirror how the most recent migration, e.g.
`0028_remove_character_avatar_url_remove_game_photo.py`, was produced.)

### Step 2 — Expose on read serializers

In `source/games/serializers/character_detail.py`, add `'money'` to `Meta.fields`
(`CharacterFullSerializer` in `character_full.py` needs no change — it extends
`CharacterDetailSerializer.Meta.fields`).

### Step 3 — Expose on the update serializer

In `source/games/serializers/character_update.py`, add `'money'` to `Meta.fields`. The
existing `extra_kwargs = {field: {'required': False} for field in fields}` comprehension
already covers it — no extra_kwargs edit needed beyond the fields list.

### Step 4 — Tests

- `source/games/tests/models/test_character.py` — default `money` is `0`; a `Character`
  with a negative `money` fails `full_clean()`/validation (follow whatever pattern the
  existing tests in this file use to assert model-level validation, if any precedent
  exists; otherwise assert via the serializer layer only and note the model-level check as
  covered there).
- `source/games/tests/serializers/test_character_detail.py` and
  `test_character_full.py` — `money` is present in the serialized output.
- `source/games/tests/serializers/test_character_update.py` — a valid `money` update is
  accepted; a negative `money` update produces a validation error on the `money` key.
- Check `source/games/tests/views/characters/` for existing PATCH/update view tests
  (e.g. covering `public_description`/`role` updates) and extend the relevant one(s) to
  also cover `money`, so the full request/response cycle is exercised, not just the
  serializer in isolation.

### Step 5 — Run the test suite

```
docker-compose run majora_app poetry run pytest games/tests/models/test_character.py games/tests/serializers/test_character_detail.py games/tests/serializers/test_character_full.py games/tests/serializers/test_character_update.py games/tests/views/characters/ --cov
```

(Adjust the exact `docker-compose` service/invocation to match how other backend work in
this repo is run — see `AGENTS.md`/`docs/agents/architecture.md` — never invoke `poetry`
directly on the host.)

## Files to Change

- `source/games/models/character.py` — add `money` field.
- `source/games/migrations/00XX_character_money.py` — new migration (auto-generated).
- `source/games/serializers/character_detail.py` — add `'money'` to `Meta.fields`.
- `source/games/serializers/character_update.py` — add `'money'` to `Meta.fields`.
- `source/games/tests/models/test_character.py` — money default/validation tests.
- `source/games/tests/serializers/test_character_detail.py` — money exposed.
- `source/games/tests/serializers/test_character_full.py` — money exposed.
- `source/games/tests/serializers/test_character_update.py` — money accepted/rejected.
- `source/games/tests/views/characters/` — extend the relevant update-view test(s).

## CI Checks

- `source`: `poetry run pytest games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views`)
- `source`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)

## Notes

- `PositiveIntegerField` mirrors the exact pattern the issue points to (`Link`/`Upload`'s
  `object_id`), so no new validation helper is needed.
- Do not add `money` to `CharacterListSerializer` — only the detail/full serializers need
  it, per the "Shared contracts" section.
- Because this PR adds a new field to a serializer, the coordinator will trigger a
  `data-access` review afterward — no action needed here beyond keeping the visibility
  rule ("same as `public_description`") intact.
