# Backend Plan: Add update of character photo

Main plan: [plan.md](plan.md)

## Shared contracts

- Produce two new PATCH endpoints:
  - `games/<slug:game_slug>/pcs/<int:character_id>/photos/<int:photo_id>/set.json`
  - `games/<slug:game_slug>/npcs/<int:character_id>/photos/<int:photo_id>/set.json`
  - Body: `{"roles": ["profile"]}`. When `"profile"` is present in `roles`, set
    `character.profile_photo` to the targeted `CharacterPhoto` (unconditionally replacing any
    previous value) and return `200` with no body. When `"profile"` is absent (empty array, or
    only unrecognized values), do nothing and still return `200`.
  - Authorization via `CharacterEditPermission.check` — same 401/403 shape already used by
    `upload_finalize` and `character_photo_upload`. Return `404` if the game, character (matching
    `game`/`npc` flag), or photo (matching that character) is not found.
- Produce a new read-only `profile_photo_id` field on `CharacterDetailSerializer`, alongside
  `profile_photo_path`, so the frontend (see [frontend.md](frontend.md)) can tell which photo is
  currently the profile photo.

## Implementation Steps

### Step 1 — Shared photo-set implementation

Create `source/games/views/characters/_photo_set.py`, mirroring the shape of
`_photo_upload.py` / `_shared._find_character`:

```python
def character_photo_set(request, game, character_id, photo_id, npc):
    """Update roles on a character's photo (e.g. mark it as the profile photo)."""
    character = _find_character(game, character_id, npc)
    if character is None:
        raise Http404

    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response

    photo = character.photos.filter(id=photo_id).first()
    if photo is None:
        raise Http404

    roles = request.data.get('roles') or []
    if 'profile' in roles:
        character.profile_photo = photo
        character.save()

    return Response(status=200)
```

Reuse `_find_character` from `_shared.py` as-is (no change needed there).

### Step 2 — Thin PC/NPC views

Create `source/games/views/characters/game_pc_photo_set.py` and
`game_npc_photo_set.py`, following exactly the `game_pc_photo_upload.py` /
`game_npc_photo_upload.py` pattern: `@api_view(['PATCH'])`,
`@authentication_classes([CookieTokenAuthentication])`, `@permission_classes([IsAuthenticated])`,
look up the `Game` via `get_object_or_404`, and delegate to `character_photo_set(...,
npc=False)` / `npc=True` respectively.

### Step 3 — Wire up exports and URLs

- Add `game_pc_photo_set` and `game_npc_photo_set` to
  `source/games/views/characters/__init__.py` and to `source/games/views/__init__.py`
  (`__all__` list too).
- Add the two new `path(...)` entries to `source/games/urls.py`, next to the existing
  `.../photo_upload.json` routes, named `game-pc-photo-set` / `game-npc-photo-set`.

### Step 4 — Serializer field

In `source/games/serializers/character_detail.py`, add:

```python
profile_photo_id = serializers.IntegerField(
    source='profile_photo.id', default=None, read_only=True
)
```

and add `'profile_photo_id'` to `Meta.fields`, right after `'profile_photo_path'`.

### Step 5 — Tests

Add `source/games/tests/views/characters/game_pc_photo_set_test.py` and
`game_npc_photo_set_test.py`, mirroring `game_pc_photo_upload_test.py` /
`game_npc_photo_upload_test.py` for fixtures/style, covering:
- Success: authenticated owner/DM/superuser sends `{"roles": ["profile"]}` for a photo
  belonging to the character → `character.profile_photo` updated, `200` returned.
- Replacing an existing profile photo with a different one already set.
- No-op: `{"roles": []}` or `{"roles": ["something-else"]}` → `profile_photo` unchanged, still
  `200`.
- Unauthenticated request → `401`.
- Authenticated but not authorized (different player, not DM) → `403`.
- Unknown game slug, character id (or wrong `npc` flag), or photo id (or photo belonging to a
  different character) → `404`.

Extend `source/games/tests/serializers/character_detail_test.py` (or the equivalent existing
serializer test file) to assert `profile_photo_id` is present and `null` when unset, and matches
`profile_photo.id` when set.

## Files to Change

- `source/games/views/characters/_photo_set.py` — new shared implementation
- `source/games/views/characters/game_pc_photo_set.py` — new thin view
- `source/games/views/characters/game_npc_photo_set.py` — new thin view
- `source/games/views/characters/__init__.py` — export new views
- `source/games/views/__init__.py` — export new views
- `source/games/urls.py` — register the two new routes
- `source/games/serializers/character_detail.py` — add `profile_photo_id`
- `source/games/tests/views/characters/game_pc_photo_set_test.py` — new tests
- `source/games/tests/views/characters/game_npc_photo_set_test.py` — new tests
- `source/games/tests/serializers/character_detail_test.py` — extend for `profile_photo_id`
  (adjust path if the existing file has a different name)

## CI Checks

- `source`: `docker-compose run majora_app poetry run pytest games/tests/views/ --cov` (CI job:
  `pytest_views`)
- `source`: `docker-compose run majora_app poetry run pytest --ignore=games/tests/views/ --cov`
  (CI job: `pytest_all`, covers the serializer test)
- `source`: `docker-compose run majora_app poetry run ruff check .` (CI job: `checks`)

## Notes

- Do not touch `upload_finalize.py` / `_set_profile_photo_if_unset` — that automatic
  "first photo becomes profile photo" behavior stays as-is; this issue only adds an explicit,
  user-triggered way to change it afterwards.
- `data-access` and `security` review are expected once this lands (new endpoint + new
  serializer field + user input handling) — flagged in the main [plan.md](plan.md).
