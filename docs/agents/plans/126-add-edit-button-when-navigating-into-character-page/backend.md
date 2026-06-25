# Backend Plan: Add edit button when navigating into character page

Main plan: [plan.md](plan.md)

## Shared contracts

This agent produces the following endpoints (consumed by the frontend):

| Method | URL | Response |
|--------|-----|----------|
| `GET` | `/games/<slug>/pcs/<id>/access.json` | `{"can_edit": true\|false}`, header `X-Skip-Cache: true` |
| `GET` | `/games/<slug>/npcs/<id>/access.json` | `{"can_edit": true\|false}`, header `X-Skip-Cache: true` |

- Always returns HTTP 200.
- Unauthenticated requests receive `{"can_edit": false}`.
- Auth is optional: use `TokenAuthentication` with `AllowAny` permission (same as `game_pc_detail`/`game_npc_detail`).

## Implementation Steps

### Step 1 — Add `game_pc_access` and `game_npc_access` views

In `source/games/views/characters.py`:

1. Add two new view functions:

```python
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_pc_access(request, game_slug, character_id):
    """Return whether the requesting user may edit a specific PC."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=False)
    can_edit = character.can_be_edited_by(request.user)
    return Response({'can_edit': can_edit}, headers={'X-Skip-Cache': 'true'})


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_npc_access(request, game_slug, character_id):
    """Return whether the requesting user may edit a specific NPC."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=True)
    can_edit = character.can_be_edited_by(request.user)
    return Response({'can_edit': can_edit}, headers={'X-Skip-Cache': 'true'})
```

Note: The `headers` kwarg on `rest_framework.response.Response` sets HTTP response headers — verify this works with the DRF version in use. If not, use `response['X-Skip-Cache'] = 'true'` after creating the response.

### Step 2 — Register the URL patterns

In `source/games/urls.py`, add two new paths:

```python
path(
    'games/<slug:game_slug>/pcs/<int:character_id>/access.json',
    views.game_pc_access,
    name='game-pc-access',
),
path(
    'games/<slug:game_slug>/npcs/<int:character_id>/access.json',
    views.game_npc_access,
    name='game-npc-access',
),
```

Place them alongside the existing `full.json` patterns for consistency.

### Step 3 — Export the views

In `source/games/views/__init__.py`, add `game_pc_access` and `game_npc_access` to the public exports (following the same pattern as the other character views already exported there).

### Step 4 — Write tests

In `source/games/tests/views_test.py`, add two test classes `TestGamePcAccessView` and `TestGameNpcAccessView`.

For each, cover:
- Anonymous request returns 200 with `can_edit: false`
- Request with a token for a user who can edit returns 200 with `can_edit: true`
- Request with a token for a user who cannot edit returns 200 with `can_edit: false`
- Response includes the `X-Skip-Cache: true` header
- 404 for unknown character
- 404 for character in wrong game

For `TestGamePcAccessView` specifically:
- PC owner returns `can_edit: true`
- DM of the game returns `can_edit: true`
- Superuser returns `can_edit: true`
- Unrelated user returns `can_edit: false`
- NPC id on the PC access endpoint returns 404

For `TestGameNpcAccessView`:
- DM of the game returns `can_edit: true`
- Superuser returns `can_edit: true`
- Player owner (not a DM) returns `can_edit: false`
- Unrelated user returns `can_edit: false`
- PC id on the NPC access endpoint returns 404

## Files to Change

- `source/games/views/characters.py` — add `game_pc_access` and `game_npc_access` functions
- `source/games/views/__init__.py` — export the two new view functions
- `source/games/urls.py` — register the two new URL patterns
- `source/games/tests/views_test.py` — add `TestGamePcAccessView` and `TestGameNpcAccessView`

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest`)
- `source/`: `docker-compose run --rm majora_tests ruff check --fix .` (CI job: `checks`)

## Notes

- Do not add `game_pc_access` or `game_npc_access` to the Navi cache warmer (`navi_config.yaml`) — these endpoints are intentionally not cached.
- The `Response` constructor's `headers` keyword may not be available in older DRF; use `response['X-Skip-Cache'] = 'true'` as a fallback if needed.
