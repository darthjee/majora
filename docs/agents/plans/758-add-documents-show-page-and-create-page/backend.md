# Backend Plan: Add documents show page and create page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the three endpoints and the `can_create_document` permissions field described in [plan.md](plan.md)'s "Shared contracts" section — exact request/response shapes there are authoritative.

## Implementation Steps

### Step 1 — `GameDocumentCreatePermission`

In `backend/games/permissions.py`, add `GameDocumentCreatePermission(_EditPermission)` directly below `GameItemCreatePermission`, as an exact mirror:

```python
class GameDocumentCreatePermission(_EditPermission):
    @classmethod
    def check(cls, request, game):
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, game))

    @classmethod
    def is_allowed(cls, user, game):
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or game.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_staff):
        return is_staff or is_superuser or is_dm
```

Write the docstring following `GameItemCreatePermission`'s (reference issue #758 instead of #784, and `GameDocument` instead of `GameItem`).

### Step 2 — Detail serializers

In `backend/games/serializers/games/documents/game_document_list.py`, add two classes after the existing `GameDocumentAllListSerializer`, mirroring `game_item_list.py`'s `GameItemDetailSerializer`/`GameItemDetailFullSerializer` exactly:

```python
class GameDocumentDetailSerializer(GameDocumentListSerializer):
    class Meta(GameDocumentListSerializer.Meta):
        fields = GameDocumentListSerializer.Meta.fields + ['description']


class GameDocumentDetailFullSerializer(HiddenFieldMixin, GameDocumentDetailSerializer):
    class Meta(GameDocumentDetailSerializer.Meta):
        fields = GameDocumentDetailSerializer.Meta.fields + ['hidden']
```

Export both from `backend/games/serializers/__init__.py` (alongside the existing `GameDocumentAllListSerializer`/`GameDocumentListSerializer` imports and `__all__` entries).

### Step 3 — Create endpoint

New file `backend/games/views/games/_document_create.py`, mirroring `_item_create.py` exactly (swap `Item`→`Document`, `GameItem`→`GameDocument`):

```python
"""Implementation for the game-level document-creation endpoint (issue #758)."""

from rest_framework import serializers
from rest_framework.response import Response

from ...models import GameDocument
from ...permissions import GameDocumentCreatePermission
from ...serializers import GameDocumentDetailFullSerializer
from ..common import validated_or_error


class _GameDocumentCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, default='', allow_blank=True)
    hidden = serializers.BooleanField(required=False, default=False)


def game_document_create(request, game):
    error_response = GameDocumentCreatePermission.check(request, game)
    if error_response:
        return error_response

    serializer = _GameDocumentCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    document = GameDocument.objects.create(game=game, **serializer.validated_data)
    return Response(GameDocumentDetailFullSerializer(document).data, status=201)
```

### Step 4 — Wire POST into the existing list view

Edit `backend/games/views/games/game_documents.py` to handle `POST`, mirroring `game_items.py`:

```python
@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_documents(request, game_slug):
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'POST':
        return game_document_create(request, game)
    documents = game.documents.filter(hidden=False)
    return paginated_list_response(request, documents, GameDocumentListSerializer)
```

(Confirm the exact current related-name/queryset used — `game.documents` — before editing; keep the existing `GET` behavior unchanged.)

### Step 5 — Detail endpoints

New file `backend/games/views/games/game_document_detail.py`, mirroring `game_item_detail.py`'s `GET` branch only (no `PATCH` — out of scope for this issue):

```python
"""View for retrieving a single non-hidden document in a specific game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...serializers import GameDocumentDetailSerializer


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_document_detail(request, game_slug, document_id):
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)
    return Response(GameDocumentDetailSerializer(document).data)
```

New file `backend/games/views/games/game_document_detail_full.py`, mirroring `game_item_detail_full.py` exactly (swap names):

```python
"""View for retrieving any document (including hidden) in a game — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...permissions import GameEditPermission
from ...serializers import GameDocumentDetailFullSerializer


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_document_detail_full(request, game_slug, document_id):
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response
    document = get_object_or_404(game.documents.all(), id=document_id)
    response = Response(GameDocumentDetailFullSerializer(document).data)
    response['X-Skip-Cache'] = 'true'
    return response
```

Export `game_document_detail` and `game_document_detail_full` from `backend/games/views/games/__init__.py`.

### Step 6 — URL routes

In `backend/games/urls/games.py`, add two routes right after the existing `documents/all.json` entry (mirroring the `items/<int:item_id>...` block's placement relative to `items/all.json`):

```python
path(
    'games/<slug:game_slug>/documents/<int:document_id>.json',
    views.game_document_detail,
    name='game-document-detail',
),
path(
    'games/<slug:game_slug>/documents/<int:document_id>/full.json',
    views.game_document_detail_full,
    name='game-document-detail-full',
),
```

### Step 7 — `can_create_document` on permissions.json

In `backend/games/serializers/games/game_permissions.py`, mirror `_get_can_create_item` with a `_get_can_create_document` method and add `data['can_create_document'] = self._get_can_create_document(obj)` to `to_representation`, using `GameDocumentCreatePermission` (imported alongside `GameItemCreatePermission`).

### Step 8 — Tests

- `backend/games/tests/permissions_test.py` — add a test class for `GameDocumentCreatePermission` mirroring the existing `GameItemCreatePermission` tests (check `.check`, `.is_allowed`, `.is_allowed_for_roles` for superuser/dm/staff/plain-player/anonymous).
- `backend/games/tests/views/games/game_documents_test.py` — extend with `POST` tests mirroring `game_items_test.py`'s additions from PR #822 (success as dm/admin/staff, 403 for a plain player, 401 anonymous, 400 on missing `name`, defaults for `description`/`hidden`).
- New `backend/games/tests/views/games/game_document_detail_test.py` and `game_document_detail_full_test.py`, mirroring the equivalent `game_item_detail*_test.py` files (minus the `PATCH` cases — GET only).
- `backend/games/tests/views/games/game_permissions_test.py` — add `can_create_document` assertions mirroring the existing `can_create_item` ones (real-identity and `?role=` paths).

## Files to Change

- `backend/games/permissions.py` — add `GameDocumentCreatePermission`
- `backend/games/serializers/games/documents/game_document_list.py` — add `GameDocumentDetailSerializer`, `GameDocumentDetailFullSerializer`
- `backend/games/serializers/__init__.py` — export the two new serializers
- `backend/games/serializers/games/game_permissions.py` — add `can_create_document`
- `backend/games/views/games/_document_create.py` — new
- `backend/games/views/games/game_documents.py` — add `POST` dispatch
- `backend/games/views/games/game_document_detail.py` — new
- `backend/games/views/games/game_document_detail_full.py` — new
- `backend/games/views/games/__init__.py` — export new views
- `backend/games/urls/games.py` — add 2 routes
- `backend/games/tests/permissions_test.py`
- `backend/games/tests/views/games/game_documents_test.py`
- `backend/games/tests/views/games/game_document_detail_test.py` — new
- `backend/games/tests/views/games/game_document_detail_full_test.py` — new
- `backend/games/tests/views/games/game_permissions_test.py`
- `docs/agents/access-control/game-document.md` — update: remove the "entirely read-only" framing, add "Document creation endpoint" and "Document detail endpoints" sections mirroring `game-item.md`'s equivalents
- `docs/agents/access-control/game.md` — add `can_create_document` to the "Edit permission"/permissions.json section, mirroring `can_create_item`

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`) — covers the new `games/tests/views/games/*` files
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers `permissions_test.py` and serializer tests
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- No migration needed — `GameDocument`/`GameDocumentPhoto` already exist; this issue only adds views/serializers/permissions/routes.
- Confirm the exact related-name (`game.documents`) and current `game_documents.py` contents before editing — read the live file first, this plan's snippet is illustrative of the target shape, not a literal diff.
- `data-access` and `security` (read-only reviewer agents) should review this PR's diff before merge, per `docs/agents/architecture.md` — not part of this implementation plan, but flag for the orchestrating skill to invoke them.
