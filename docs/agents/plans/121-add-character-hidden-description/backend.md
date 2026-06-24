# Backend Plan: Add Character Hidden Description

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **produces**:
- `GET /games/<slug>/pcs/<id>/full.json` and `GET /games/<slug>/npcs/<id>/full.json` — returns full character detail including `private_description`, gated by `can_be_edited_by()`.
- `PATCH /games/<slug>/pcs/<id>.json` and `PATCH /games/<slug>/npcs/<id>.json` now also accept `private_description`.
- The field `description` is renamed to `public_description` in the DB and in all serializers; the existing `CharacterDetailSerializer` returns `public_description` (not `description`).

Response shape for the `/full` endpoints:
```json
{
  "id": 1,
  "name": "Aragorn",
  "avatar_url": null,
  "character_class": "Ranger",
  "level": 10,
  "public_description": "A ranger from the north.",
  "private_description": "Actually the heir to the throne of Gondor.",
  "is_pc": true,
  "photos": [],
  "game_slug": "lotr",
  "can_edit": true
}
```

## Implementation Steps

### Step 1 — Add migration: rename description and add private_description

Create a new migration (next number after `0014_gamemaster.py`, so `0015_character_descriptions.py`) that:
1. Renames the `description` column to `public_description` on the `games_character` table (use `RenameField`).
2. Adds `private_description = models.TextField(blank=True)` to the table.

### Step 2 — Update the Character model

In `source/games/models/character.py`:
- Rename `description = models.TextField(blank=True)` to `public_description = models.TextField(blank=True)`.
- Add `private_description = models.TextField(blank=True)`.

### Step 3 — Update serializers

In `source/games/serializers.py`:

1. **`CharacterDetailSerializer`**: replace `'description'` with `'public_description'` in `fields`.
2. **`CharacterUpdateSerializer`**: replace `'description'` with `'public_description'` in `fields`; add `'private_description'`.
3. **Add `CharacterFullSerializer`**: inherits from `CharacterDetailSerializer`, adds `private_description` to `fields`. No extra permission logic here — access is enforced in the view.

### Step 4 — Add full-detail views

In `source/games/views/characters.py`:

Add two new view functions:

```python
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_npc_full(request, game_slug, character_id):
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=True)
    if not character.can_be_edited_by(request.user):
        return Response({'errors': {'detail': ['not allowed']}}, status=403)
    serializer = CharacterFullSerializer(character, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_pc_full(request, game_slug, character_id):
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=False)
    if not character.can_be_edited_by(request.user):
        return Response({'errors': {'detail': ['not allowed']}}, status=403)
    serializer = CharacterFullSerializer(character, context={'request': request})
    return Response(serializer.data)
```

Also import `CharacterFullSerializer` at the top of the file.

### Step 5 — Add URL patterns

In `source/games/urls.py`, add:

```python
path(
    'games/<slug:game_slug>/npcs/<int:character_id>/full.json',
    views.game_npc_full,
    name='game-npc-full',
),
path(
    'games/<slug:game_slug>/pcs/<int:character_id>/full.json',
    views.game_pc_full,
    name='game-pc-full',
),
```

### Step 6 — Update admin

In `source/games/admin.py`, if `description` appears in any `fields` or `list_display`, rename to `public_description`.

### Step 7 — Write tests

Add tests in `source/games/tests/views_test.py` for:
- `GET /games/<slug>/pcs/<id>/full.json` — returns 403 for unauthenticated, 403 for non-editor, 200 with `public_description` and `private_description` for the PC's player and for a DM.
- `GET /games/<slug>/npcs/<id>/full.json` — returns 403 for unauthenticated, 403 for PC player (not a DM), 200 with both description fields for a DM.
- `PATCH /games/<slug>/npcs/<id>.json` with `private_description` in the payload — verifies it is saved.
- `PATCH /games/<slug>/pcs/<id>.json` with `private_description` in the payload — verifies it is saved.

Update any existing tests that reference `character.description` or the `description` key in response JSON to use `public_description` instead.

Also add/update model tests in `source/games/tests/models/test_character.py` for the new field.

## Files to Change

- `source/games/migrations/0015_character_descriptions.py` — new migration (create)
- `source/games/models/character.py` — rename field, add field
- `source/games/serializers.py` — update serializers, add `CharacterFullSerializer`
- `source/games/views/characters.py` — add `game_npc_full` and `game_pc_full` views
- `source/games/urls.py` — add two new URL patterns
- `source/games/admin.py` — rename field reference if present
- `source/games/tests/views_test.py` — new tests, update existing ones
- `source/games/tests/models/test_character.py` — update/add model tests

## CI Checks

- `source/`: `docker-compose run --rm majora poetry run pytest` (CI job: `pytest`)

## Notes

- The `can_be_edited_by()` method on `Character` already handles the PC-owner vs DM-only distinction correctly — no changes needed there.
- Return HTTP 403 (not 401) for authenticated users who lack edit access; return 403 for unauthenticated users too (consistent with the existing PATCH gate which returns 401 for unauthenticated — but for a GET-only endpoint that reveals private data, 403 is appropriate regardless of auth state; alternatively mirror the PATCH pattern and return 401 for unauthenticated. Use 401 for unauthenticated, 403 for authenticated non-editors, matching the PATCH pattern).
- The migration must use `RenameField` (not `RemoveField`+`AddField`) so existing data is preserved.
