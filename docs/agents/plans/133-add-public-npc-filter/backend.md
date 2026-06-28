# Backend Plan: Add public NPC filter

Main plan: [plan.md](plan.md)

## Shared contracts

### New `hidden` field

- `Character.hidden = models.BooleanField(default=False)` — add this field and generate the migration.
- Add `hidden` to `CharacterUpdateSerializer.Meta.fields` so DMs/superusers may PATCH it.

### New endpoint

`GET /games/<slug:game_slug>/npcs/all.json` — authenticated, DM/superuser only.
- Returns `401` unauthenticated, `403` not a DM/superuser.
- Same `CharacterListSerializer` shape: `[{id, name, avatar_url, game_slug}, ...]`.
- Same `Paginator` wrapper as `game_npcs`.

### Behaviour changes to existing endpoints

- `game_npcs` — add `.filter(hidden=False)` to the queryset.
- `game_npc_detail` — after fetching the character, if it is hidden and the requester cannot edit it, return 404.

## Implementation Steps

### Step 1 — Add `hidden` field to Character model and migrate

In `source/games/models/character.py`, add:

```python
hidden = models.BooleanField(default=False)
```

Then generate the migration:

```bash
docker-compose run backend python manage.py makemigrations
```

### Step 2 — Update `game_npcs` view to filter hidden NPCs

In `source/games/views/characters.py`, change the `game_npcs` view to:

```python
npcs = game.characters.filter(npc=True, hidden=False)
```

### Step 3 — Update `game_npc_detail` to 404 on hidden NPCs for non-editors

In `game_npc_detail`, after fetching the character, add a guard:

```python
if character.hidden and not character.can_be_edited_by(request.user):
    from django.http import Http404
    raise Http404
```

This must happen before the GET serializer path and before PATCH processing.

### Step 4 — Add `game_npcs_all` view

Add a new view in `source/games/views/characters.py`:

```python
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_npcs_all(request, game_slug):
    """Return all NPCs (including hidden) for a game — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    # Reuse CharacterEditPermission-style gate but for the game's DMs.
    # Use GameEditPermission to guard access at the game level.
    from ..permissions import GameEditPermission
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response
    npcs = game.characters.filter(npc=True)
    page_npcs, headers = Paginator(request, npcs).paginate()
    serializer = CharacterListSerializer(page_npcs, many=True)
    return Response(serializer.data, headers=headers)
```

### Step 5 — Register the new URL

In `source/games/urls.py`, add:

```python
path(
    'games/<slug:game_slug>/npcs/all.json',
    views.game_npcs_all,
    name='game-npcs-all',
),
```

This must be placed **before** the existing `games/<slug:game_slug>/npcs/<int:character_id>.json` pattern so Django doesn't try to parse `all` as an integer.

### Step 6 — Add `hidden` to `CharacterUpdateSerializer`

In `source/games/serializers/character_update.py`, add `'hidden'` to `fields`:

```python
fields = [
    'name',
    'avatar_url',
    'character_class',
    'level',
    'public_description',
    'private_description',
    'hidden',
]
```

### Step 7 — Export the new view

In `source/games/views/__init__.py` (or wherever `game_npcs` is exported), export `game_npcs_all`.

### Step 8 — Write tests

- `source/games/tests/views/characters_test.py`:
  - `game_npcs` — assert hidden NPCs are excluded from the public listing.
  - `game_npc_detail` — assert 404 is returned for a hidden NPC when accessed without DM rights; assert DMs can still access it.
  - `game_npcs_all` — assert 401 for unauthenticated, 403 for non-DM authenticated user, 200 with all NPCs (including hidden) for DMs and superusers.
- `source/games/tests/serializers/test_character_update.py` — assert `hidden` is a writable field.

## Files to Change

- `source/games/models/character.py` — add `hidden` field
- `source/games/migrations/0020_character_hidden.py` — new migration (auto-generated)
- `source/games/views/characters.py` — update `game_npcs`, `game_npc_detail`; add `game_npcs_all`
- `source/games/views/__init__.py` — export `game_npcs_all`
- `source/games/serializers/character_update.py` — add `hidden` to fields
- `source/games/urls.py` — register `game-npcs-all`
- `source/games/tests/views/characters_test.py` — new test cases
- `source/games/tests/serializers/test_character_update.py` — new test case for `hidden`

## CI Checks

- `source/`: `docker-compose run backend poetry run pytest` (CI job: `pytest`)

## Notes

- `GameEditPermission.check` is the correct gate for `game_npcs_all` because NPC visibility is a game-level concern (any DM of the game may see all NPCs). `CharacterEditPermission` is character-level and would require a character instance.
- The URL ordering in `urls.py` is critical: `npcs/all.json` must come before `npcs/<int:character_id>.json` to prevent routing conflicts.
- The `hidden` field defaults to `False`, so all existing NPCs remain visible after the migration.
