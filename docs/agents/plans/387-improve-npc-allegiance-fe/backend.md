# Backend Plan: Improve NPC allegiance FE

Main plan: [plan.md](plan.md)

## Shared contracts

- `CharacterCreateSerializer` must accept `allegiance` and `public_allegiance`
  (both optional, `ally`/`enemy`/`neutral`, model default `neutral`), matching
  how `CharacterUpdateSerializer` already exposes them.
- No new endpoint, no authorization change — `POST /games/<slug>/npcs.json`
  already enforces `GameEditPermission` before touching the serializer.

## Implementation Steps

### Step 1 — Add the two fields to `CharacterCreateSerializer`

Edit `source/games/serializers/character_create.py`:
- Add `'allegiance'` and `'public_allegiance'` to `Meta.fields`.
- Add `'allegiance': {'required': False}` and
  `'public_allegiance': {'required': False}` to `Meta.extra_kwargs`, matching
  the existing per-field style already used in this file (unlike
  `CharacterUpdateSerializer`, which uses a dict comprehension — keep this
  file's existing explicit-per-field style rather than switching styles,
  to keep the diff minimal).

### Step 2 — Tests

Extend `source/games/tests/views/characters/game_characters_test.py`
(`TestGameNpcsPost` — see `test_optional_fields_are_persisted_when_provided`
and `test_defaults_apply_when_optional_fields_omitted` around lines 298-323):
- Add `'allegiance': 'ally'` and `'public_allegiance': 'enemy'` to the
  payload in `test_optional_fields_are_persisted_when_provided`, and assert
  `character.allegiance == 'ally'` / `character.public_allegiance == 'enemy'`.
- In `test_defaults_apply_when_optional_fields_omitted`, additionally assert
  `character.allegiance == 'neutral'` and
  `character.public_allegiance == 'neutral'` when omitted from the payload.

No new test file is needed — there is no existing
`test_character_create.py` serializer unit test file, and view-level
coverage (as above) is the established pattern for this serializer (it has
no dedicated serializer test file today).

## Files to Change

- `source/games/serializers/character_create.py` — add `allegiance`/
  `public_allegiance` to `fields`/`extra_kwargs`
- `source/games/tests/views/characters/game_characters_test.py` — extend
  the two tests noted above to cover the new fields

## CI Checks

- `source/`: `docker-compose run --rm backend poetry run pytest games/tests/views/characters/` (CI job: `pytest_views_characters`)

## Notes

- This is a pure field-exposure change to an existing serializer/endpoint —
  no migration needed (the model fields already exist since migration
  `0038_character_allegiance_character_public_allegiance`).
- `data-access` review should still be invoked once this lands, since it
  changes which fields a serializer accepts on an existing endpoint (new
  writable fields on `CharacterCreateSerializer`).
