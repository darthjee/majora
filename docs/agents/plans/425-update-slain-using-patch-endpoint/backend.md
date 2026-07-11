# Backend Plan: Update slain using patch endpoint

Main plan: [plan.md](plan.md)

## Shared contracts

- Add `slain` and `public_slain` as optional (`required=False`), writable fields on
  `CharacterUpdateSerializer` (`source/games/serializers/character_update.py`). This serializer is already
  used, via `partial=True`, by both the NPC and PC PATCH endpoints (`detail_or_update` /
  `character_detail`), so a request body of `{"slain": true}` or `{"public_slain": false}` alone must
  validate and save correctly, matching what the frontend already sends today.
- The response returned by `PATCH /games/:game_slug/npcs/:id.json` stays the standard
  `CharacterDetailSerializer` payload — no change needed there. The frontend agent has confirmed it does not
  read the response body of the slain-toggle call.
- Delete the dedicated `PATCH /games/:game_slug/npcs/:id/slain.json` endpoint (route name
  `game-npc-slain-set`) entirely in this same change.

## Implementation Steps

### Step 1 — Make `slain`/`public_slain` writable on the main update serializer

In `source/games/serializers/character_update.py`:
- Add `'slain'` and `'public_slain'` to `CharacterUpdateSerializer.Meta.fields`.
- They're plain `BooleanField`s on the `Character` model already picked up by `ModelSerializer`, so no
  explicit field declaration is needed — just extend `Meta.fields`; the existing
  `extra_kwargs = {field: {'required': False} for field in fields if field != 'links'}` comprehension will
  automatically mark both as `required=False` since it iterates `fields` after the addition.

### Step 2 — Remove the dedicated slain endpoint

Delete:
- `source/games/views/characters/game_npc_slain_set.py` (the view)
- `source/games/views/characters/_slain_set.py` (the shared `character_slain_set` implementation)
- `source/games/serializers/character_slain_update.py` (`CharacterSlainUpdateSerializer`)

Update:
- `source/games/urls.py` — remove the `games/<slug:game_slug>/npcs/<int:character_id>/slain.json` route
  (name `game-npc-slain-set`, lines ~102-106) and its `views.game_npc_slain_set` reference.
- `source/games/views/characters/__init__.py` (or wherever `game_npc_slain_set` is re-exported) — remove the
  now-dangling import.
- `source/games/serializers/__init__.py` — remove the `CharacterSlainUpdateSerializer` export.

### Step 3 — Update/remove tests

- Delete `source/games/tests/views/characters/game_npc_slain_set_test.py` (tests the removed endpoint).
- Extend `source/games/tests/serializers/test_character_update.py` (and/or the NPC detail PATCH view test,
  under `source/games/tests/views/characters/`) to cover:
  - PATCH with only `{"slain": true}` persists `slain` and leaves other fields untouched.
  - PATCH with only `{"public_slain": true}` persists `public_slain` and leaves other fields untouched.
  - Existing permission tests on the main NPC PATCH endpoint already cover the permission-check path — no
    new permission test is needed since the rule is unchanged (`CharacterEditPermission`).

### Step 4 — Sanity-check `CharacterDetailSerializer`

No change expected: `slain = serializers.BooleanField(source='public_slain', read_only=True)`
(`source/games/serializers/character_detail.py:24`) stays as-is — reads are unaffected, only the write path
changes. Confirm no test asserts on the removed endpoint's response shape (`{"slain": ..., "public_slain": ...}`)
anywhere else in the suite.

## Files to Change

- `source/games/serializers/character_update.py` — add `slain`, `public_slain` to writable fields.
- `source/games/urls.py` — remove the `slain.json` route.
- `source/games/views/characters/game_npc_slain_set.py` — delete.
- `source/games/views/characters/_slain_set.py` — delete.
- `source/games/serializers/character_slain_update.py` — delete.
- `source/games/views/characters/__init__.py` — remove dangling import/export.
- `source/games/serializers/__init__.py` — remove dangling import/export.
- `source/games/tests/views/characters/game_npc_slain_set_test.py` — delete.
- `source/games/tests/serializers/test_character_update.py` — add `slain`/`public_slain` write coverage.

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest games/tests/views/characters/ --cov` (CI job: `pytest_views_characters`)
- `source/`: `docker-compose run --rm majora_tests pytest games/tests/ --ignore=games/tests/views/ --cov` (CI job: `pytest_all`, covers serializer tests)
- `source/`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- `CharacterUpdateSerializer` is shared between the NPC and PC PATCH endpoints, so this change also makes
  `slain`/`public_slain` writable on player characters via `PATCH /games/:game_slug/pcs/:id.json`. Confirmed
  acceptable during issue discussion — no PC-specific gating is needed.
- Double-check for any other reference to `game_npc_slain_set` / `CharacterSlainUpdateSerializer` / `_slain_set`
  (e.g. `source/games/views/characters/__init__.py` export lists) before considering the removal complete —
  a stray import would break app startup.
