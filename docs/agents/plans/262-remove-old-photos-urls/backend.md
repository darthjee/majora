# Backend Plan: Remove old photos urls

Main plan: [plan.md](plan.md)

## Shared contracts

This agent's changes define the new contract consumed by `frontend` (see `plan.md`'s
"Shared contracts" section for the full list). In short: `photo` disappears from every Game
serializer (list/detail/create/update) and `avatar_url` disappears from every Character
serializer (list/detail/full/update). `cover_photo_path` and `profile_photo_path` are
unaffected and remain the sole photo fields.

## Implementation Steps

### Step 1 — Remove the model fields

- `source/games/models/game.py` — remove the `photo = models.URLField(null=True, blank=True)`
  field from `Game`.
- `source/games/models/character.py` — remove the
  `avatar_url = models.URLField(null=True, blank=True)` field from `Character`.

### Step 2 — Migration

Generate (or hand-write, matching the generated shape) a new migration
`0028_remove_game_photo_remove_character_avatar_url.py` (or similar auto-generated name),
depending on `0027_characterphoto_character_profile_photo_delete_photo`, with two
`RemoveField` operations:

```python
migrations.RemoveField(model_name='game', name='photo'),
migrations.RemoveField(model_name='character', name='avatar_url'),
```

Run `docker-compose run --rm majora_tests python manage.py makemigrations` (or the project's
equivalent manage.py invocation) to generate it rather than hand-writing, then verify the
result matches this shape.

### Step 3 — Update serializers

- `source/games/serializers/game_list.py` — drop `'photo'` from `Meta.fields` (keep
  `cover_photo_path`).
- `source/games/serializers/game_detail.py` — drop `'photo'` from `Meta.fields`.
- `source/games/serializers/game_update.py` — drop `'photo'` from `Meta.fields` (and from
  `extra_kwargs` if present — it isn't currently).
- `source/games/serializers/game_create.py` — drop `'photo'` from `Meta.fields` and remove
  its `extra_kwargs` entry (`'photo': {'required': False, 'allow_null': True}`).
- `source/games/serializers/character_list.py` — drop `'avatar_url'` from `Meta.fields`.
- `source/games/serializers/character_detail.py` — drop `'avatar_url'` from `Meta.fields`.
- `source/games/serializers/character_update.py` — drop `'avatar_url'` from `Meta.fields`.
- `source/games/serializers/character_full.py` — no direct change needed; it inherits
  `CharacterDetailSerializer.Meta.fields` and only adds `private_description`.

### Step 4 — Update backend tests

Remove all references to the dropped fields — both as model-creation kwargs (which will now
raise `TypeError`) and as serialized-response assertions. Replace "invalid URL" validation
scenarios that relied on `photo`/`avatar_url`'s `URLField` validation with an equivalent
invalid payload against a field that still exists (e.g. a `name` value exceeding
`max_length=200` for `GameUpdateSerializer`/game views, and similarly for
`CharacterUpdateSerializer`/character views — check what field is easiest to invalidate there,
e.g. an overly long `name`).

Files known to need updates (verify there are no others via a repo-wide search before
finishing):
- `source/games/tests/models/test_character.py` — drop the `avatar_url=` kwarg and its
  assertion.
- `source/games/tests/serializers/test_game_detail.py` — drop `photo=` kwarg and the
  `data['photo']` assertion.
- `source/games/tests/serializers/test_character_full.py` — drop `'avatar_url'` from the
  `expected_fields` list.
- `source/games/tests/serializers/game_create_test.py` — remove/rework the two tests that
  create with `photo=None` / `photo='http://...'` and assert `game.photo`.
- `source/games/tests/serializers/test_game_list.py` — drop `photo=` kwarg and `data['photo']`
  assertion.
- `source/games/tests/serializers/test_game_update.py` — drop `photo=` kwarg, the
  `data={'photo': ...}` update test, and the `data={'photo': 'not-a-url'}` invalid-payload
  test (replace with a still-valid invalid-field scenario, or drop if no longer meaningful —
  keep at least one "invalid payload → 400" test for this serializer).
- `source/games/tests/serializers/test_character_list.py` — drop `avatar_url=` kwarg and
  `test_serializes_avatar_url`.
- `source/games/tests/serializers/test_character_detail.py` — drop `avatar_url=` kwarg and
  `test_serializes_avatar_url`.
- `source/games/tests/views/common_test.py` — the two
  `data={'photo': 'not-a-url'}` cases (lines ~87 and ~125) no longer trigger a validation
  error once `photo` is removed from `GameUpdateSerializer`; replace with a payload that is
  actually invalid against the remaining fields (e.g. `name` exceeding `max_length=200`).
- `source/games/tests/views/characters/game_npc_detail_test.py` — drop `avatar_url` from the
  update payload/assertions and rework the `avatar_url: 'not-a-url'` 400 test.
- `source/games/tests/views/characters/game_pc_detail_test.py` — same as above for PCs.
- `source/games/tests/views/games/game_detail_test.py` — drop the `'photo' in data` assertion,
  the `photo` update payload/assertion, and rework the `photo: 'not-a-url'` 400 test.
- `source/games/tests/views/games/games_list_test.py` — drop all `photo=`/`'photo'`
  creation kwargs and assertions (list serialization and create-endpoint tests).

### Step 5 — Update access-control doc

Update `docs/agents/access-control.md` (the issue explicitly calls this out):
- **Game section**: remove `photo` from "Exposed fields" and "Write fields"; remove the
  "frontend prefers it over the legacy `photo` URL field" sentence in the
  `cover_photo_path` paragraph; update the "Create response" fields list to drop `photo`.
- **Character section**: remove `avatar_url` from the "Fields returned" columns in both the
  List and Detail tables; remove the "frontend prefers it over the legacy `avatar_url` field"
  sentence in the `profile_photo_path` paragraph.

This doc update is architect-owned territory in general, but since it is tightly coupled to
this serializer change and explicitly requested by the issue, do it as part of this same
backend change set (the architect will do a final pass afterward regardless).

### Step 6 — Run the dev cycle

```bash
docker-compose run --rm majora_tests pytest
docker-compose run --rm majora_tests ruff check .
```

Fix any failures before committing.

## Files to Change

- `source/games/models/game.py` — remove `photo` field.
- `source/games/models/character.py` — remove `avatar_url` field.
- `source/games/migrations/0028_*.py` — new migration removing both fields.
- `source/games/serializers/game_list.py`, `game_detail.py`, `game_update.py`,
  `game_create.py` — drop `photo`.
- `source/games/serializers/character_list.py`, `character_detail.py`,
  `character_update.py` — drop `avatar_url`.
- `source/games/tests/**` (files listed in Step 4) — updated/removed assertions and fixtures.
- `docs/agents/access-control.md` — remove `photo`/`avatar_url` mentions.

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest` (CI job: backend test job)
- `source/`: `docker-compose run --rm majora_tests ruff check .` (CI job: backend lint job)

## Notes

- Double-check for any other backend usage of `Game.photo` / `Character.avatar_url` beyond
  what was found during planning (e.g. admin.py registrations, fixtures/factories) via a
  repo-wide `grep -rn "avatar_url\|\.photo\b" source/games` before finishing, since the
  exploration here was based on a point-in-time search.
- `CharacterUpdateSerializer` currently sets `extra_kwargs = {field: {'required': False} for
  field in fields}` — this is derived from `fields`, so no explicit `avatar_url` entry needs
  manual removal there; just removing it from `fields` is sufficient.
