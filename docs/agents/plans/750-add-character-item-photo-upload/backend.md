# Backend Plan: Add Character Item Photo Upload

Main plan: [plan.md](plan.md)

## Shared contracts

Produces: `POST /games/<slug:game_slug>/<pcs|npcs>/<int:character_id>/items/<int:item_id>/photo_upload.json`
returning `{"upload_id": <int>, "token": "<string>", "item_id": <int>}` on `201`, per
`plan.md`'s "Shared contracts". Also produces the `CharacterItemPhoto` branch in the existing
`PATCH /uploads/<upload_id>.json` finalize endpoint, and the new `can_upload_item_photo` field on
`.../permissions.json`. Implements the authorization formula from `plan.md` as a new
`CharacterItemPhotoUploadPermission` class, mirroring the existing `CharacterItemCreatePermission`
exactly. Proxy depends only on the two new routes existing — no backend code change needed for
the cache-cleanup wiring itself.

## Implementation Steps

### Step 1 — `CharacterItemPhotoUploadPermission`

Add to `backend/games/permissions.py`, modeled directly on `CharacterItemCreatePermission`
(same file, ~line 160) — same formula, same public `is_allowed`/`is_allowed_for_roles` shape
(needed by the new serializer field in Step 4):

```python
class CharacterItemPhotoUploadPermission(_EditPermission):
    """Encapsulate checks for the PC/NPC item photo-upload endpoint (issue #750).

    Deliberately mirrors CharacterItemCreatePermission's formula exactly (dm/admin/staff, plus
    the owning player for PCs) rather than CharacterPhotoUploadPermission's broader "any player
    of the game" grant used for a character's own photo — per the issue's explicit "admin,
    owner, staff and dm" authorization ask. Kept as its own class (not a reuse of
    CharacterItemCreatePermission) so the two actions' rules can diverge independently later.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not upload a photo for `character`'s item."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may upload a photo for an item held by `character`."""
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or character.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_owner, is_staff, is_pc):
        """Return whether a role-simulated caller may upload a photo for a character's item.

        Mirrors `CharacterItemCreatePermission.is_allowed_for_roles` exactly.
        """
        if is_staff or is_superuser or is_dm:
            return True
        return is_owner if is_pc else False
```

### Step 2 — Shared item photo-upload init implementation

New shared module `backend/games/views/game/_item_photo_upload.py`, following
`_photo_upload.py`'s shape (character lookup → permission check → `UploadInitiator`) but with a
fixed/deterministic path like `treasure_photo_upload.py`, not `_photo_upload.py`'s randomized
one — `CharacterItem.photo` is a single override FK, not a gallery:

```python
"""Shared implementation for the character item photo upload-init endpoints."""

import os

from django.shortcuts import get_object_or_404

from ...models import CharacterItemPhoto
from ...permissions import CharacterItemPhotoUploadPermission
from .._upload_init import UploadInitiator
from ._shared import _get_character_or_404


def character_item_photo_upload(request, game, game_slug, character_id, item_id, npc):
    """Initialise a character item photo upload and return the upload id and token."""
    character = _get_character_or_404(game, character_id, npc)
    item = get_object_or_404(character.character_items, pk=item_id)

    error_response = CharacterItemPhotoUploadPermission.check(request, character)
    if error_response:
        return error_response

    kind = 'npcs' if npc else 'pcs'
    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(
            game_slug, kind, character_id, item_id, filename,
        ),
        create_photo=lambda file_path: _reuse_or_create_photo(item, file_path),
        id_field='item_id',
        id_value=item.id,
    )
    return initiator.run()


def _build_file_path(game_slug, kind, character_id, item_id, filename):
    """Fixed, deterministic path — a CharacterItem has at most one photo override, always replaced."""
    _, ext = os.path.splitext(filename)
    return f'photos/games/{game_slug}/{kind}/{character_id}/items/{item_id}/photo{ext}'


def _reuse_or_create_photo(item, file_path):
    """Return the item's existing CharacterItemPhoto updated with `file_path`, or a new one."""
    if item.photo_id is not None:
        photo = item.photo
        photo.path = file_path
        photo.ready = False
        photo.save()
        return photo
    return CharacterItemPhoto.objects.create(character_item=item, path=file_path, ready=False)
```

Add the factory to `backend/games/views/game/_character_shared.py` (alongside
`build_photo_upload_view`), and import `character_item_photo_upload` at the top with the other
`._xxx` imports:

```python
def build_item_photo_upload_view(npc):
    """Build the POST item photo-upload-init view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['POST'], IsAuthenticated)
    def view(request, game_slug, character_id, item_id):
        """Initialise a PC/NPC item photo upload and return the upload id and token."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_item_photo_upload(
            request, game, game_slug, character_id, item_id, npc=npc,
        )

    return view
```

### Step 3 — Route + thin view wrappers

Add one new entry to `_CHARACTER_ROUTES` in `backend/games/urls/_character_routes.py`, right
after `('/items/<int:item_id>/all.json', 'item_detail_all')`:

```python
('/items/<int:item_id>/photo_upload.json', 'item_photo_upload'),
```

This automatically generates both `games/<slug>/pcs/<id>/items/<item_id>/photo_upload.json` and
the `/npcs/` equivalent, resolved to `views.game_pc_item_photo_upload`/
`views.game_npc_item_photo_upload` respectively — no `urls.py` changes needed beyond this.

Add the two thin wrapper files, mirroring `game_pc_photo_upload.py`/`game_npc_photo_upload.py`:
- `backend/games/views/game/pcs/detail/items/game_pc_item_photo_upload.py`:
  ```python
  """View for the PC item photo upload init endpoint."""

  from ...._character_shared import build_item_photo_upload_view

  game_pc_item_photo_upload = build_item_photo_upload_view(npc=False)
  ```
- `backend/games/views/game/npcs/detail/items/game_npc_item_photo_upload.py`: same shape,
  `npc=True`.

Export `game_pc_item_photo_upload`/`game_npc_item_photo_upload` through the full chain, matching
`game_pc_item_detail_all`'s existing entries exactly at each level:
- `backend/games/views/game/pcs/__init__.py` and `backend/games/views/game/npcs/__init__.py`
  (import + `__all__`).
- `backend/games/views/game/__init__.py` (import + `__all__`).
- `backend/games/views/__init__.py` (the `from .game import (...)` block + `__all__`).

### Step 4 — Extend `upload_finalize`

Edit `backend/games/views/upload_finalize.py`:
- Import `CharacterItemPhoto` and `CharacterItemPhotoUploadPermission`.
- `_check_permission`: add a branch checked **before** the final `GameEditPermission` fallback
  (which assumes `content_object.game` exists directly — a `CharacterItemPhoto` has no `.game`,
  only `.character_item.character.game`, so it must be branched explicitly or it will crash):
  ```python
  if isinstance(content_object, CharacterItemPhoto):
      return CharacterItemPhotoUploadPermission.check(
          request, content_object.character_item.character,
      )
  ```
- `_mark_content_object_ready`: add a branch calling a new `_set_character_item_photo` helper,
  also before the final `else` fallback:
  ```python
  elif isinstance(content_object, CharacterItemPhoto):
      _set_character_item_photo(content_object)
  ```
  ```python
  def _set_character_item_photo(item_photo):
      """Set the character item's photo to `item_photo`, always replacing any existing one."""
      item = item_photo.character_item
      item.photo = item_photo
      item.save()
  ```
  Unconditional set (like `_set_treasure_photo`), not "if unset" — a `CharacterItem`, like a
  `Treasure`/`GameItem`, has at most one current photo override.

### Step 5 — `can_upload_item_photo` permissions field

Edit `backend/games/serializers/characters/character_permissions.py`, mirroring
`_get_can_create_item` exactly:

```python
from games.permissions import CharacterItemCreatePermission, CharacterItemPhotoUploadPermission

# in to_representation:
data['can_upload_item_photo'] = self._get_can_upload_item_photo(obj)

def _get_can_upload_item_photo(self, character):
    """Return whether the requester (real or role-simulated) may upload an item photo."""
    if character is None:
        return False
    roles = self._roles()
    if roles is not None:
        return CharacterItemPhotoUploadPermission.is_allowed_for_roles(
            roles['is_superuser'], roles['is_dm'], roles['is_owner'], roles['is_staff'],
            character.is_pc,
        )
    return CharacterItemPhotoUploadPermission.is_allowed(self._user(), character)
```

### Step 6 — Docs

Update `docs/agents/access-control/character-item.md`: remove "along with photo upload" from the
"left for follow-up issues" sentence in the intro, and add a short "Item photo upload" section
mirroring the existing "Item creation endpoints" section's shape (endpoint table, permission
formula, the new `can_upload_item_photo` field).

### Step 7 — Tests

- `backend/games/tests/permissions_test.py`: add `CharacterItemPhotoUploadPermission` cases
  (staff/dm/superuser allowed for both kinds, PC owner allowed, NPC has no owner-equivalent case,
  unrelated authenticated user 403, anonymous 401) — mirror the existing
  `CharacterItemCreatePermission` test cases in the same file.
- New `backend/games/tests/views/game/pcs/detail/items/game_pc_item_photo_upload_test.py` and
  the `npcs` equivalent, mirroring `game_pc_photo_upload_test.py`: 201 on success (staff, dm,
  superuser, PC owner), 403 for an unrelated authenticated user, 401 unauthenticated, 404 for
  unknown `game_slug`/`character_id`/`item_id` (or an id belonging to the opposite PC/NPC role),
  400 for a bad `filename`. Also assert the file path shape
  (`photos/games/<slug>/<pcs|npcs>/<character_id>/items/<item_id>/photo.<ext>`) and that
  re-uploading reuses the same `CharacterItemPhoto` row (`ready` reset to `False`, same `pk`).
- `backend/games/tests/views/upload_finalize_test.py`: extend with a `CharacterItemPhoto`
  section mirroring the existing `TreasurePhoto` cases — `uploading`/`uploaded` status
  transitions, `CharacterItem.photo` gets set unconditionally (including when one is already
  set), permission checks for staff/dm/PC-owner allowed and unrelated user 403.
- `can_create_item` has no standalone serializer unit test — it's covered at the view level in
  `backend/games/tests/views/game/pcs/detail/game_pc_permissions_test.py` and the
  `npcs/detail/game_npc_permissions_test.py` equivalent (the `.../permissions.json` endpoint
  tests). Extend both with equivalent `can_upload_item_photo` cases, for both the real-identity
  and role-simulated (`?role=`) paths.

## Files to Change

- `backend/games/permissions.py` — add `CharacterItemPhotoUploadPermission`.
- `backend/games/views/game/_item_photo_upload.py` — new shared implementation.
- `backend/games/views/game/_character_shared.py` — add `build_item_photo_upload_view`.
- `backend/games/urls/_character_routes.py` — new route entry.
- `backend/games/views/game/pcs/detail/items/game_pc_item_photo_upload.py` — new thin view.
- `backend/games/views/game/npcs/detail/items/game_npc_item_photo_upload.py` — new thin view.
- `backend/games/views/game/pcs/__init__.py`, `backend/games/views/game/npcs/__init__.py`,
  `backend/games/views/game/__init__.py`, `backend/games/views/__init__.py` — export the new
  views through the chain.
- `backend/games/views/upload_finalize.py` — `CharacterItemPhoto` branch in both dispatch points.
- `backend/games/serializers/characters/character_permissions.py` — new
  `can_upload_item_photo` field.
- `docs/agents/access-control/character-item.md` — document the new endpoints/field.
- `backend/games/tests/permissions_test.py` — new permission test cases.
- `backend/games/tests/views/game/pcs/detail/items/game_pc_item_photo_upload_test.py` — new.
- `backend/games/tests/views/game/npcs/detail/items/game_npc_item_photo_upload_test.py` — new.
- `backend/games/tests/views/upload_finalize_test.py` — extended with `CharacterItemPhoto` cases.
- `backend/games/tests/views/game/pcs/detail/game_pc_permissions_test.py` and
  `backend/games/tests/views/game/npcs/detail/game_npc_permissions_test.py` — extended with
  `can_upload_item_photo` cases.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/game/ --cov` (CI job:
  `pytest_views_characters`) — covers the two new item photo-upload view test files.
- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`) — covers `upload_finalize_test.py`.
- `backend`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/` (CI job:
  `pytest_all`) — covers `permissions_test.py` and the serializer test.
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- `CharacterItemPhotoUploadPermission._is_allowed`/`is_allowed` intentionally does not
  special-case `user.is_superuser` explicitly — `character.can_be_edited_by(user)` already
  returns `True` for a superuser, exactly like `CharacterItemCreatePermission`.
