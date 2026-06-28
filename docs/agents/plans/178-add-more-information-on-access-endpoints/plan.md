# Plan: Add More Information on Access Endpoints

Issue: [178-add-more-information-on-access-endpoints.md](../issues/178-add-more-information-on-access-endpoints.md)

## Overview

Extend the three access endpoints to return contextual diagnostic fields alongside the existing `can_edit` boolean. All new fields return `null` when the request is unauthenticated. This is a pure backend change — no frontend modifications are required, as the new fields are additive and existing consumers only read `can_edit`.

## Context

The three access views currently return only `{'can_edit': <bool>}`. When access is denied, there is no contextual information available to diagnose why. Adding `username`, `is_superuser`, `is_dm`, and (for the PC endpoint) `is_owner` allows developers and administrators to inspect the response directly.

## Implementation Steps

### Step 1 — Add `_user_game_context` helper to `games/views/games.py`

Add a helper function that builds the user context dict for the game access endpoint:

```python
def _user_game_context(request, game):
    """Return user context fields for game access response."""
    user = request.user
    if not user or not user.is_authenticated:
        return {'username': None, 'is_superuser': None, 'is_dm': None}
    return {
        'username': user.username,
        'is_superuser': user.is_superuser,
        'is_dm': game.game_masters.filter(user=user).exists() if game else False,
    }
```

Update `game_access` to merge these fields into the response:

```python
def game_access(request, game_slug):
    game = Game.objects.filter(game_slug=game_slug).first()
    can_edit = _resolve_can_edit(request, game)
    data = {'can_edit': can_edit}
    data.update(_user_game_context(request, game))
    response = Response(data)
    response['X-Skip-Cache'] = 'true'
    return response
```

### Step 2 — Add `_user_character_context` helper to `games/views/characters.py`

Add a helper function that builds the user context dict for character access endpoints (game + is_dm):

```python
def _user_character_context(request, game):
    """Return user context fields (username, is_superuser, is_dm) for character access."""
    user = request.user
    if not user or not user.is_authenticated:
        return {'username': None, 'is_superuser': None, 'is_dm': None}
    return {
        'username': user.username,
        'is_superuser': user.is_superuser,
        'is_dm': game.game_masters.filter(user=user).exists() if game else False,
    }
```

Add a helper for `is_owner`:

```python
def _is_owner(user, character):
    """Return True if user is the player who owns this character."""
    if character is None or character.player is None or character.player.user_id is None:
        return False
    return character.player.user_id == user.id
```

Update `game_pc_access` to include `username`, `is_superuser`, `is_dm`, `is_owner`:

```python
def game_pc_access(request, game_slug, character_id):
    game = Game.objects.filter(game_slug=game_slug).first()
    character = _find_character(game, character_id, npc=False)
    can_edit = _character_can_edit(request, character)
    data = {'can_edit': can_edit}
    data.update(_user_character_context(request, game))
    user = request.user
    if user and user.is_authenticated:
        data['is_owner'] = _is_owner(user, character)
    else:
        data['is_owner'] = None
    response = Response(data)
    response['X-Skip-Cache'] = 'true'
    return response
```

Update `game_npc_access` to include `username`, `is_superuser`, `is_dm`:

```python
def game_npc_access(request, game_slug, character_id):
    game = Game.objects.filter(game_slug=game_slug).first()
    character = _find_character(game, character_id, npc=True)
    can_edit = _character_can_edit(request, character)
    data = {'can_edit': can_edit}
    data.update(_user_character_context(request, game))
    response = Response(data)
    response['X-Skip-Cache'] = 'true'
    return response
```

### Step 3 — Update tests for `game_access` (games_test.py)

Add tests in `TestGameAccessView` verifying:
- Unauthenticated request: `username`, `is_superuser`, `is_dm` are all `null`
- DM request: `username` equals dm username, `is_superuser` is `False`, `is_dm` is `True`
- Superuser request: `username` equals superuser username, `is_superuser` is `True`, `is_dm` is `False` (unless also a GM)
- Non-DM authenticated user: `username` equals their username, `is_superuser` is `False`, `is_dm` is `False`

### Step 4 — Update tests for `game_pc_access` (characters_test.py)

Add tests in `TestGamePcAccessView` verifying:
- Unauthenticated: `username`, `is_superuser`, `is_dm`, `is_owner` are all `null`
- Owner (not DM): `username` correct, `is_superuser` `False`, `is_dm` `False`, `is_owner` `True`
- DM (not owner): `username` correct, `is_superuser` `False`, `is_dm` `True`, `is_owner` `False`
- Superuser (not owner/DM): `username` correct, `is_superuser` `True`, `is_dm` `False`, `is_owner` `False`
- Unrelated user: `username` correct, `is_superuser` `False`, `is_dm` `False`, `is_owner` `False`

### Step 5 — Update tests for `game_npc_access` (characters_test.py)

Add tests in `TestGameNpcAccessView` verifying:
- Unauthenticated: `username`, `is_superuser`, `is_dm` are all `null`
- DM: `username` correct, `is_superuser` `False`, `is_dm` `True`
- Superuser: `username` correct, `is_superuser` `True`, `is_dm` `False`
- Non-DM authenticated user: `username` correct, `is_superuser` `False`, `is_dm` `False`

## Files to Change

- `source/games/views/games.py` — add `_user_game_context` helper, update `game_access` view
- `source/games/views/characters.py` — add `_user_character_context` and `_is_owner` helpers, update `game_pc_access` and `game_npc_access` views
- `source/games/tests/views/games_test.py` — add tests for new fields in `TestGameAccessView`
- `source/games/tests/views/characters_test.py` — add tests for new fields in `TestGamePcAccessView` and `TestGameNpcAccessView`

## CI Checks

- `source/`: `docker-compose run --rm majora_tests poetry run pytest` (CI job: `pytest`)
- `source/`: `docker-compose run --rm majora_tests poetry run ruff check --fix .` (CI job: `checks`)

## Notes

- No database migrations needed — these are view-level response changes only.
- No frontend changes needed — the new fields are additive; existing consumers only read `can_edit`.
- The `is_dm` field returns `False` (not `null`) when the game does not exist but the user is authenticated, because an authenticated user is definitively not a DM of a non-existent game. The issue spec only says `null` when anonymous.
- The `X-Skip-Cache` header must remain on all three access endpoints — its behaviour is unchanged.
