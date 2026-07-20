# Backend Plan: Add Game Item photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

Produces: `POST /games/<slug:game_slug>/items/<int:item_id>/photo_upload.json` returning
`{"upload_id": <int>, "token": "<string>", "item_id": <int>}` on `201`, per `plan.md`'s
"Shared contracts". Also produces the `GameItemPhoto` branch in the existing
`PATCH /uploads/<upload_id>.json` finalize endpoint (no URL/shape change there — frontend
already calls it generically). Implements the authorization formula from `plan.md` as a new
`GameItemPhotoUploadPermission` class. Proxy depends on this route existing (and only this
route — no backend code changes are needed for the cache-cleanup wiring itself).

## Implementation Steps

### Step 1 — `GameItemPhotoUploadPermission`

Add to `backend/games/permissions.py`, modeled directly on `CharacterPhotoUploadPermission`
(same file, ~line 74) but checked against a `Game` instead of a `Character`:

```python
class GameItemPhotoUploadPermission(_EditPermission):
    """Broadened item photo-upload action, mirroring CharacterPhotoUploadPermission (#619)."""

    @classmethod
    def check(cls, request, game):
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, game))

    @classmethod
    def _is_allowed(cls, user, game):
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)
```

### Step 2 — Photo-upload init view

New view, following `backend/games/views/treasures/treasure_photo_upload.py`'s shape
(permission check → `UploadInitiator`). Existing `GameItem` views (`game_items.py`,
`game_item_detail.py`, `game_items_all.py`, `game_item_detail_all.py`) all live flat in
`backend/games/views/games/` (that resource family hasn't been migrated to the nested
`game/items/` convention from `views-organization.md` yet — see that doc's "Status" note).
Add the new file as a sibling there for consistency with its neighbors:
`backend/games/views/games/game_item_photo_upload.py`.

```python
"""View for the game item photo upload init endpoint."""

import os
import uuid

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

from accounts.authentication import CookieTokenAuthentication

from ...models import Game, GameItem, GameItemPhoto
from ...permissions import GameItemPhotoUploadPermission
from .._upload_init import UploadInitiator


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_item_photo_upload(request, game_slug, item_id):
    """Initialise a game item photo upload and return the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)
    item = get_object_or_404(GameItem, pk=item_id, game=game)

    error_response = GameItemPhotoUploadPermission.check(request, game)
    if error_response:
        return error_response

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(game_slug, item_id, filename),
        create_photo=lambda file_path: _reuse_or_create_photo(item, file_path),
        id_field='item_id',
        id_value=item.id,
    )
    return initiator.run()


def _build_file_path(game_slug, item_id, filename):
    """Fixed, deterministic path — a GameItem has at most one photo, always replaced."""
    _, ext = os.path.splitext(filename)
    return f'photos/games/{game_slug}/items/{item_id}/photo{ext}'


def _reuse_or_create_photo(item, file_path):
    """Return the item's existing GameItemPhoto updated with `file_path`, or a new one."""
    if item.photo_id is not None:
        photo = item.photo
        photo.path = file_path
        photo.ready = False
        photo.save()
        return photo
    return GameItemPhoto.objects.create(game_item=item, path=file_path, ready=False)
```

Note: unlike the Character upload path, this does **not** use `uuid`/randomized filenames —
double-check the final import list drops `uuid` if unused (it's listed in the docstring only
for contrast with `_photo_upload.py`'s character variant; the item variant doesn't need it).

Register the route in `backend/games/urls/games.py`, right after the existing
`games/<slug:game_slug>/items/<int:item_id>/all.json` entry:

```python
path(
    'games/<slug:game_slug>/items/<int:item_id>/photo_upload.json',
    views.game_item_photo_upload,
    name='game-item-photo-upload',
),
```

Export `game_item_photo_upload` in both `__init__.py` files, matching `game_item_detail`'s
existing entries exactly:
- `backend/games/views/games/__init__.py`: add `from .game_item_photo_upload import
  game_item_photo_upload` and add `'game_item_photo_upload'` to `__all__`.
- `backend/games/views/__init__.py`: add `game_item_photo_upload` to the `from .games import
  (...)` block and to `__all__`.

### Step 3 — Extend `upload_finalize`

Edit `backend/games/views/upload_finalize.py`:
- Import `GameItemPhoto` and `GameItemPhotoUploadPermission` (or reuse
  `GameEditPermission`/whatever's simplest — but per the shared contract, the finalize-time
  check must allow the same admin/staff/dm/player set as init, so it should use
  `GameItemPhotoUploadPermission` too, not `GameEditPermission`).
- `_check_permission`: add a branch —
  ```python
  if isinstance(content_object, GameItemPhoto):
      return GameItemPhotoUploadPermission.check(request, content_object.game_item.game)
  ```
  before the final `GameEditPermission` fallback (which currently handles `GamePhoto` as the
  catch-all `else`; `GameItemPhoto` must be checked explicitly before that fallback runs, since
  a `GameItemPhoto` is not a `GamePhoto`).
- `_mark_content_object_ready`: add a branch calling a new `_set_item_photo` helper —
  ```python
  elif isinstance(content_object, GameItemPhoto):
      _set_item_photo(content_object)
  ```
  ```python
  def _set_item_photo(item_photo):
      """Set the item's photo to `item_photo`, always replacing any existing one."""
      item = item_photo.game_item
      item.photo = item_photo
      item.save()
  ```
  Unconditional set (like `_set_treasure_photo`), not "if unset" (unlike
  `_set_cover_photo_if_unset`/`_set_profile_photo_if_unset`) — a `GameItem`, like a
  `Treasure`, has at most one current photo.

### Step 4 — `GameItemPhotoSerializer` (optional, for parity)

Add `backend/games/serializers/games/items/game_item_photo.py` — confirmed existing folder,
alongside `game_item_list.py` and `character_item_fields.py`:

```python
class GameItemPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameItemPhoto
        fields = ['id', 'path']
```

Mirrors `TreasurePhotoSerializer`/`CharacterPhotoSerializer`. Not required by any endpoint in
this issue (`photo_path` on `GameItemListSerializer` already resolves server-side via
`source='photo.path'`), but keep it for consistency unless the backend agent judges it truly
dead code — if so, note the omission in this plan's outcome rather than silently skipping it.

### Step 5 — Tests

- `backend/games/tests/permissions_test.py`: add `GameItemPhotoUploadPermission` cases
  (staff/player/dm/superuser allowed; unrelated authenticated user 403; anonymous 401) —
  mirror the existing `CharacterPhotoUploadPermission` test cases in the same file.
- New `backend/games/tests/views/games/game_item_photo_upload_test.py`, mirroring
  `backend/games/tests/views/treasures/treasure_photo_upload_test.py`: 201 on success (staff,
  dm, player, superuser), 403 for an unrelated authenticated user, 401 unauthenticated, 404 for
  unknown `game_slug`/`item_id` or an `item_id` belonging to a different game, 400 for a bad
  `filename`. Also assert the file path shape
  (`photos/games/<slug>/items/<id>/photo.<ext>`) and that re-uploading reuses the same
  `GameItemPhoto` row (`ready` reset to `False`, same `pk`).
- `backend/games/tests/views/upload_finalize_test.py`: extend with a `GameItemPhoto` section
  mirroring the existing `TreasurePhoto` cases — `uploading`/`uploaded` status transitions,
  `GameItem.photo` gets set unconditionally (including when one is already set — no
  "does not overwrite" case, unlike `Game`/`Character`), permission checks for staff/dm/player
  allowed and unrelated user 403.

## Files to Change

- `backend/games/permissions.py` — add `GameItemPhotoUploadPermission`.
- `backend/games/views/games/game_item_photo_upload.py` — new init view.
- `backend/games/views/games/__init__.py` (and `backend/games/views/__init__.py` if it
  re-exports flatly) — export the new view.
- `backend/games/urls/games.py` — new route.
- `backend/games/views/upload_finalize.py` — `GameItemPhoto` branch in both dispatch points.
- `backend/games/serializers/games/items/game_item_photo.py` — new serializer (optional, see
  Step 4).
- `backend/games/serializers/__init__.py` — export it, if added.
- `backend/games/tests/permissions_test.py` — new permission test cases.
- `backend/games/tests/views/games/game_item_photo_upload_test.py` — new test file.
- `backend/games/tests/views/upload_finalize_test.py` — extended with `GameItemPhoto` cases.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`) plus `pytest games/tests/permissions_test.py` (covered by `pytest_all`, CI job: `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- `GameItemPhotoUploadPermission`'s `_is_allowed` intentionally does not special-case
  `user.is_superuser` explicitly — `game.can_be_edited_by(user)` already returns `True` for a
  superuser (see `common-rules.md`'s "Full derivations"), exactly like
  `CharacterPhotoUploadPermission`.
