# Backend Plan: Add photo deletion

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the full endpoint table, the new `CharacterPhotoDeletePermission`, and the new `can_delete_photo` serializer field. This agent produces all three new endpoints, the permission class, and the serializer field.

## Implementation Steps

### Step 1 — Add `CharacterPhotoDeletePermission`

In `backend/games/permissions.py`, add (near `CharacterPhotoUploadPermission`/`CharacterTreasureExchangePermission`):

```python
class CharacterPhotoDeletePermission(_EditPermission):
    """Allow only staff, a DM of the character's game, or a superuser to delete a photo."""

    @classmethod
    def check(cls, request, character):
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or character.game.can_be_edited_by(user)
```

### Step 2 — Shared view handlers

New `backend/games/views/game/_photo_detail.py`:

```python
"""Shared implementation for the character photo detail (update-ready / delete) endpoints."""

from django.http import Http404
from rest_framework.response import Response

from ...permissions import CharacterPhotoDeletePermission
from ._shared import _get_character_or_404


def character_photo_detail(request, game, character_id, photo_id, npc):
    character = _get_character_or_404(game, character_id, npc)

    error_response = CharacterPhotoDeletePermission.check(request, character)
    if error_response:
        return error_response

    photo = character.photos.filter(id=photo_id).first()
    if photo is None:
        raise Http404

    if request.method == 'PATCH':
        return _update_ready(character, photo)
    return _delete(photo)


def _update_ready(character, photo):
    photo.ready = False
    photo.save()
    if character.profile_photo_id == photo.id:
        character.profile_photo = None
        character.save()
    response = Response(status=200)
    response['X-Skip-Cache'] = 'true'
    return response


def _delete(photo):
    if photo.ready:
        response = Response(status=422)
        response['X-Skip-Cache'] = 'true'
        return response
    photo.delete()
    response = Response(status=204)
    response['X-Skip-Cache'] = 'true'
    return response
```

New `backend/games/views/game/_photo_deletable.py`:

```python
"""Shared implementation for the character photo deletable-check endpoint."""

from django.http import Http404
from rest_framework.response import Response

from ...permissions import CharacterPhotoDeletePermission
from ._shared import _get_character_or_404


def character_photo_deletable(request, game, character_id, photo_id, npc):
    character = _get_character_or_404(game, character_id, npc)

    error_response = CharacterPhotoDeletePermission.check(request, character)
    if error_response:
        return error_response

    photo = character.photos.filter(id=photo_id).first()
    if photo is None:
        raise Http404

    status = 422 if photo.ready else 200
    body = {'deletable': not photo.ready, 'path': photo.path} if status == 200 else None
    response = Response(body, status=status)
    response['X-Skip-Cache'] = 'true'
    return response
```

Only include `path` in the 200 body per the issue's spec; on 422 return an empty body (mirror whatever the closest existing 422 response shape does, e.g. `_photo_upload.py`'s validation-error shape, for consistency).

### Step 3 — Factories in `_character_shared.py`

Add, next to `build_photo_set_view`:

```python
def build_photo_detail_view(npc):
    @_build_api_view(['PATCH', 'DELETE'], IsAuthenticated)
    def view(request, game_slug, character_id, photo_id):
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_photo_detail(request, game, character_id, photo_id, npc=npc)
    return view


def build_photo_deletable_view(npc):
    @_build_api_view(['GET'], IsAuthenticated)
    def view(request, game_slug, character_id, photo_id):
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_photo_deletable(request, game, character_id, photo_id, npc=npc)
    return view
```

Import `character_photo_detail`/`character_photo_deletable` from the new `_photo_detail.py`/`_photo_deletable.py` modules alongside the existing `character_photo_set` import.

### Step 4 — Thin wrapper views (4 new files)

Mirror `game_pc_photo_set.py`/`game_npc_photo_set.py` exactly:

- `backend/games/views/game/pcs/detail/photos/game_pc_photo_detail.py`:
  ```python
  """View for the PC photo detail (update-ready / delete) endpoint."""

  from ...._character_shared import build_photo_detail_view

  game_pc_photo_detail = build_photo_detail_view(npc=False)
  ```
- `backend/games/views/game/npcs/detail/photos/game_npc_photo_detail.py` — same, `build_photo_detail_view(npc=True)`.
- `backend/games/views/game/pcs/detail/photos/game_pc_photo_deletable.py` — `build_photo_deletable_view(npc=False)`.
- `backend/games/views/game/npcs/detail/photos/game_npc_photo_deletable.py` — `build_photo_deletable_view(npc=True)`.

Register all four in `backend/games/views/game/__init__.py` and `backend/games/views/__init__.py`, matching how `game_pc_photo_set`/`game_npc_photo_set` are already exported.

### Step 5 — URL routes

In `backend/games/urls/_character_routes.py`, add to `_CHARACTER_ROUTES`:

```python
('/photos/<int:photo_id>.json', 'photo_detail'),
('/photos/<int:photo_id>/deletable.json', 'photo_deletable'),
```

This auto-wires `game-pc-photo-detail`, `game-npc-photo-detail`, `game-pc-photo-deletable`, `game-npc-photo-deletable` for both `pcs.py` and `npcs.py` — no per-kind route file edits needed.

### Step 6 — `can_delete_photo` on `CharacterDetailSerializer`

In `backend/games/serializers/characters/character_detail.py`:
- Import `CharacterPhotoDeletePermission` alongside the existing permission imports.
- Add `can_delete_photo = serializers.SerializerMethodField()` and `'can_delete_photo'` to `Meta.fields`.
- Add:
  ```python
  def get_can_delete_photo(self, obj):
      """Return whether the requesting user (from context) may delete `obj`'s photos."""
      request = self.context.get('request')
      user = request.user if request else None
      return CharacterPhotoDeletePermission.is_allowed(user, obj)
  ```

### Step 7 — Test helper: add `delete` to `TokenAuthRequestMixin`

`backend/games/tests/behaviors.py` currently only has `get`/`patch`/`post`/`put`. Add:

```python
def delete(self, client, url, token=None):
    return client.delete(url, **self.auth_kwargs(token))
```

(mirror the exact `auth_kwargs`/header-building convention already used by `patch`).

### Step 8 — Tests

Mirror `game_pc_photo_set_test.py`'s fixture/mixin style (`TokenAuthRequestMixin`, `GameFactory`/`PlayerFactory`/`CharacterFactory`/`SuperUserFactory`/`UserFactory`) for each new file, both PC and NPC:

- `backend/games/tests/views/game/pcs/detail/photos/game_pc_photo_detail_test.py` / npc mirror — cover: 401 unauthenticated; 403 for the owning player and for a non-DM player of the game (this is the key behavioral difference from `photo_set`'s tests — those roles are now *rejected*); 200 for dm/staff/superuser on PATCH; 200/204 for dm/staff/superuser on DELETE; 422 on DELETE when `ready` is `True`; 404 for unknown character/photo/game, and for a photo belonging to another character; PATCH clears `profile_photo` when the patched photo was the profile photo; response carries `X-Skip-Cache: true`.
- `backend/games/tests/views/game/pcs/detail/photos/game_pc_photo_deletable_test.py` / npc mirror — 404 not found; 422 when `ready` is `True`; 200 `{deletable: true, path: ...}` when `ready` is `False`; permission tests (403 for player/owner, 200 for dm/staff/superuser); hidden-character access still gated by game access for dm, same as existing hidden-state precedent.
- `backend/games/tests/serializers/characters/character_detail_test.py` — extend with cases asserting `can_delete_photo` is `True` for dm/staff/superuser and `False` for the owning player / unrelated player / anonymous.
- Add a small permission unit test (mirror wherever `CharacterPhotoUploadPermission`/`CharacterTreasureExchangePermission` are unit-tested, if such a file exists) for `CharacterPhotoDeletePermission.is_allowed`.

## Files to Change
- `backend/games/permissions.py` — new `CharacterPhotoDeletePermission`.
- `backend/games/views/game/_photo_detail.py` — new.
- `backend/games/views/game/_photo_deletable.py` — new.
- `backend/games/views/game/_character_shared.py` — new `build_photo_detail_view`/`build_photo_deletable_view` factories + imports.
- `backend/games/views/game/pcs/detail/photos/game_pc_photo_detail.py` — new.
- `backend/games/views/game/npcs/detail/photos/game_npc_photo_detail.py` — new.
- `backend/games/views/game/pcs/detail/photos/game_pc_photo_deletable.py` — new.
- `backend/games/views/game/npcs/detail/photos/game_npc_photo_deletable.py` — new.
- `backend/games/views/game/__init__.py`, `backend/games/views/__init__.py` — export the four new views.
- `backend/games/urls/_character_routes.py` — two new route tuples.
- `backend/games/serializers/characters/character_detail.py` — new `can_delete_photo` field.
- `backend/games/tests/behaviors.py` — new `delete` helper on `TokenAuthRequestMixin`.
- `backend/games/tests/views/game/pcs/detail/photos/game_pc_photo_detail_test.py` — new.
- `backend/games/tests/views/game/npcs/detail/photos/game_npc_photo_detail_test.py` — new.
- `backend/games/tests/views/game/pcs/detail/photos/game_pc_photo_deletable_test.py` — new.
- `backend/games/tests/views/game/npcs/detail/photos/game_npc_photo_deletable_test.py` — new.
- `backend/games/tests/serializers/characters/character_detail_test.py` — extend.

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/game/ --cov` (CI job: `pytest_views_characters`).
- `backend`: `docker-compose run --rm majora_tests pytest --cov` (CI job: `pytest_all`) for the serializer test.
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`).

## Notes
- No migration needed — `ready`/`path` already exist on `BasePhoto`; nothing new is added to the model.
- `photo.delete()` relies on `Character.profile_photo`'s `on_delete=SET_NULL` as a safety net; the explicit clear in `_update_ready` (PATCH step) means DELETE should never actually need that fallback in the normal flow, but it's good to have as a backstop for interrupted flows (an already-not-ready photo that somehow still is `profile_photo` when deleted directly).
- The existing `character_photo_set` (PATCH `/set.json`) handler does **not** set `X-Skip-Cache` today — out of scope for this issue, but worth flagging; not fixing it here to avoid scope creep.
