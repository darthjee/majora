# Backend Plan: Add documents photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" — this agent produces all three new endpoints, the
new `GameDocumentPhotoUploadPermission`, and must keep `documentConfig.js`'s expected path shapes
in sync with the frontend agent (`/games/<game_slug>/documents/<document_id>/photo_upload.json`
for upload-init).

## Implementation Steps

### Step 1 — Add `GameDocumentPhotoUploadPermission`

In `backend/games/permissions.py`, add a new class immediately after
`GameItemPhotoUploadPermission` (around line 118), copying its shape exactly but for a
`GameDocument`'s owning `game`:

```python
class GameDocumentPhotoUploadPermission(_EditPermission):
    """Broadened document photo-upload action, mirroring GameItemPhotoUploadPermission (#749)."""

    @classmethod
    def check(cls, request, game):
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, game))

    @classmethod
    def _is_allowed(cls, user, game):
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)
```

Used, unconditionally, for all three new endpoints below (list is also gated, unlike Character's
effectively-public list, since the flat dm/player/staff permission applies to "the new buttons
and endpoints" per the issue with no narrower tier called out) — actually apply the same
hidden-gate-only public read Character's list uses (`_hidden_gate_response`), not a hard
permission check, so an unauthenticated visitor can still see a non-hidden document's photos;
only gate the hidden case behind this permission, exactly mirroring `character_photos`'
`check_hidden` branch.

### Step 2 — Add the GET photos-list endpoint

New file `backend/games/views/games/game_document_photos.py`, mirroring
`backend/games/views/game/_photos.py` (`character_photos`) but scoped directly to `GameDocument`
(no PC/NPC `npc` parameter needed — this is a flat game-level resource like `GameItem`):

```python
"""View for the game document photos-list endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Game, GameDocument
from ...serializers import GameDocumentPhotoSerializer
from ..common import paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_document_photos(request, game_slug, document_id):
    """Return a paginated list of ready photos for a specific game document."""
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(GameDocument, pk=document_id, game=game)
    photos = document.photos.filter(ready=True)
    return paginated_list_response(request, photos, GameDocumentPhotoSerializer)
```

(No hidden-gate branch needed here — unlike Character, `GameDocument.hidden` scopes catalog
*listing*, not per-document detail visibility; the existing `documents/<id>.json`/`full.json`
split already handles that, and the photos-list endpoint mirrors that same
public/non-hidden-detail visibility by simply not restricting on `hidden` at all, matching how
`game_document_detail`/`game_documents` never gate reads by anything other than `AllowAny`.)

### Step 3 — Add the POST photo-upload-init endpoint

New file `backend/games/views/games/game_document_photo_upload.py`, structurally identical to
`backend/games/views/games/game_item_photo_upload.py`, but **do not reuse the existing photo on
upload** — always create a new `GameDocumentPhoto` row (this is the key behavioral difference
from `GameItem`, since we're following the multi-photo Character model per the issue):

```python
"""View for the game document photo upload init endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

from accounts.authentication import CookieTokenAuthentication

from ...models import Game, GameDocument, GameDocumentPhoto
from ...permissions import GameDocumentPhotoUploadPermission
from ...photo_path import PhotoPathBuilder
from .._upload_init import UploadInitiator


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_document_photo_upload(request, game_slug, document_id):
    """Initialise a game document photo upload and return the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(GameDocument, pk=document_id, game=game)

    error_response = GameDocumentPhotoUploadPermission.check(request, game)
    if error_response:
        return error_response

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(game_slug, document_id, filename),
        create_photo=lambda file_path: GameDocumentPhoto.objects.create(
            game_document=document, path=file_path, ready=False
        ),
        id_field='document_id',
        id_value=document.id,
    )
    return initiator.run()


def _build_file_path(game_slug, document_id, filename):
    """Derive the storage path, uuid-suffixed since a document can have many photos."""
    segments = ['games', game_slug, 'documents', document_id]
    return PhotoPathBuilder(segments, filename, use_uuid=True).build()
```

`use_uuid=True` (unlike `GameItem`'s fixed-path/`use_uuid=False`) since every upload is a new,
independently-kept photo, not a replacement — mirrors `character_photo_upload`'s
`_build_file_path`.

### Step 4 — Add the PATCH photo-set (display) endpoint

New file `backend/games/views/games/game_document_photo_set.py`, mirroring
`backend/games/views/game/_photo_set.py` (`character_photo_set`):

```python
"""View for the game document photo set (display) endpoint."""

from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game, GameDocument
from ...permissions import GameDocumentPhotoUploadPermission


@api_view(['PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_document_photo_set(request, game_slug, document_id, photo_id):
    """Update roles on a game document's photo (e.g. mark it as the display photo)."""
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(GameDocument, pk=document_id, game=game)

    error_response = GameDocumentPhotoUploadPermission.check(request, game)
    if error_response:
        return error_response

    photo = document.photos.filter(id=photo_id).first()
    if photo is None:
        raise Http404

    if 'display' in (request.data.get('roles') or []):
        document.photo = photo
        document.save()

    return Response(status=200)
```

Use `GameDocumentPhotoUploadPermission` here too (not a narrower editor-only check) — the issue
specifies one flat dm/player/staff permission for all three new endpoints, deliberately not
mirroring Character's narrower `CharacterEditPermission` tier for its own `set` endpoint.

### Step 5 — Wire "first upload becomes display" into `upload_finalize.py`

In `backend/games/views/upload_finalize.py`:
- Import `GameDocumentPhoto` and `GameDocumentPhotoUploadPermission` alongside the existing
  photo-model/permission imports.
- Add `_set_document_photo_if_unset(document_photo)`, mirroring `_set_profile_photo_if_unset`
  (line 107-112): set `document_photo.game_document.photo` only if it's currently unset — do
  **not** always-replace like `_set_item_photo` does, since we're following the "first upload
  becomes display, subsequent uploads just add to the gallery until explicitly `set`" Character
  rule the issue calls for.
- Add `_document_photo_permission(request, content_object)`, mirroring
  `_game_item_photo_permission` (line 146-148) but via `content_object.game_document.game`.
- Register `GameDocumentPhoto: (_document_photo_permission, _set_document_photo_if_unset)` in
  `_PHOTO_HANDLERS` (line 166-171).

### Step 6 — Wire up URLs

In `backend/games/views/games/__init__.py`: import and re-export
`game_document_photos`, `game_document_photo_upload`, `game_document_photo_set` (alongside the
existing `game_document_*` imports/`__all__` entries).

In `backend/games/urls/games.py`, add three new `path()` entries right after the existing
`documents/<int:document_id>/full.json` entry (around line 55):

```python
path(
    'games/<slug:game_slug>/documents/<int:document_id>/photos.json',
    views.game_document_photos,
    name='game-document-photos',
),
path(
    'games/<slug:game_slug>/documents/<int:document_id>/photo_upload.json',
    views.game_document_photo_upload,
    name='game-document-photo-upload',
),
path(
    'games/<slug:game_slug>/documents/<int:document_id>/photos/<int:photo_id>/set.json',
    views.game_document_photo_set,
    name='game-document-photo-set',
),
```

### Step 7 — Tests

Add `backend/games/tests/views/games/test_game_document_photos.py`,
`test_game_document_photo_upload.py`, and `test_game_document_photo_set.py`, mirroring the
existing `games/tests/views/games/test_game_item_photo_upload.py` (for upload-init: 401/403/201
cases, permission matrix — staff/player/dm/random-user) plus the equivalent character photo-list
and photo-set test files (mirroring their list-pagination and roles-based set assertions,
including the "first upload becomes display, second upload does not override it" behavior and
the explicit `set` endpoint overriding it afterwards). Also extend
`backend/games/tests/views/test_upload_finalize.py` with a `GameDocumentPhoto` case for the
new `_set_document_photo_if_unset` branch.

## Files to Change

- `backend/games/permissions.py` — add `GameDocumentPhotoUploadPermission`
- `backend/games/views/games/game_document_photos.py` — new, GET list view
- `backend/games/views/games/game_document_photo_upload.py` — new, POST upload-init view
- `backend/games/views/games/game_document_photo_set.py` — new, PATCH set-display view
- `backend/games/views/games/__init__.py` — export the three new views
- `backend/games/urls/games.py` — register the three new routes
- `backend/games/views/upload_finalize.py` — register `GameDocumentPhoto`'s handlers
- `backend/games/tests/views/games/test_game_document_photos.py` — new
- `backend/games/tests/views/games/test_game_document_photo_upload.py` — new
- `backend/games/tests/views/games/test_game_document_photo_set.py` — new
- `backend/games/tests/views/test_upload_finalize.py` — extend
- `backend/games/tests/test_permissions.py` (or equivalent) — extend for the new permission class

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest games/tests/views/games/ games/tests/views/test_upload_finalize.py games/tests/test_permissions.py --cov` (CI job: `pytest_views_rest`)
- `backend/`: `docker-compose run --rm majora_tests ruff check games/` (CI job: `checks`)

## Notes

- `docs/agents/access-control/game-document.md` needs a follow-up update (new "Document photo
  endpoints" section, mirroring `game-item.md`'s photo-upload write-up plus the character
  pattern's list/set entries) — update it in the same PR alongside the code, per this repo's
  documentation convention (`AGENTS.md`: keep docs in sync with any new endpoint).
- `docs/agents/product.md`'s `GameDocument`/`CharacterDocument` section (around line 123-134)
  currently says GameDocument has "no create, update, or photo upload flow yet" — update that
  sentence once this issue ships.
