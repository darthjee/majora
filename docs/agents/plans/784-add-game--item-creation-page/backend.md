# Backend Plan: Add Game Item Creation Page

Main plan: [plan.md](plan.md)

## Shared contracts

- New endpoint `POST /games/<slug>/items.json` — reuses the existing `game_items` view/URL,
  branching on `request.method`. Body: `{name (required), description?, hidden?}`. Auth: new
  `GameItemCreatePermission` (dm/admin/staff, checked inline, no owner concept). Response: `201`
  with `GameItemDetailFullSerializer(item).data` (`id`/`name`/`photo_path`/`description`/`hidden`)
  — frontend keys off `data.id`, not `data.game_item_id`. `400`/`{errors}` on invalid payload.
- New `can_create_item` field on `GamePermissionsSerializer` (`GET /games/<slug>/permissions.json`),
  backed by the same `GameItemCreatePermission`.
- Photo upload endpoint is untouched — no work needed there.

## Implementation Steps

### Step 1 — Add `GameItemCreatePermission`

In `backend/games/permissions.py`, add a new class near `GameItemPhotoUploadPermission`/
`CharacterItemCreatePermission`, mirroring `CharacterItemCreatePermission`'s shape but scoped to
`Game` instead of `Character`, with no owner allowance (a bare `GameItem` has no owning
character):

```python
class GameItemCreatePermission(_EditPermission):
    """Encapsulate checks for the game-level item-creation endpoint (issue #784).

    Grants the same access as GameEditPermission (superuser or a GameMaster of the game) plus
    any Staff account (globally) — mirroring CharacterItemCreatePermission's shape, minus the
    PC-owner allowance since a bare GameItem has no owning character.
    """

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not create an item for `game`."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, game))

    @classmethod
    def is_allowed(cls, user, game):
        """Return whether `user` may create a new item for `game`."""
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or game.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_staff):
        """Return whether a role-simulated caller may create a new item for a game."""
        return is_staff or is_superuser or is_dm
```

### Step 2 — Add the create implementation

New file `backend/games/views/games/_item_create.py`, mirroring
`backend/games/views/game/_item_create.py` but creating only a `GameItem` (no `CharacterItem`):

```python
"""Implementation for the game-level item-creation endpoint (issue #784)."""

from rest_framework import serializers
from rest_framework.response import Response

from ...models import GameItem
from ...permissions import GameItemCreatePermission
from ...serializers import GameItemDetailFullSerializer
from ..common import validated_or_error


class _GameItemCreateSerializer(serializers.Serializer):
    """Validate the name/description/hidden payload for creating a bare game item."""

    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, default='', allow_blank=True)
    hidden = serializers.BooleanField(required=False, default=False)


def game_item_create(request, game):
    """Create a new GameItem for `game`, with no owning CharacterItem."""
    error_response = GameItemCreatePermission.check(request, game)
    if error_response:
        return error_response

    serializer = _GameItemCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    item = GameItem.objects.create(game=game, **serializer.validated_data)
    return Response(GameItemDetailFullSerializer(item).data, status=201)
```

### Step 3 — Wire `POST` into `game_items`

Update `backend/games/views/games/game_items.py` to accept `GET`/`POST`, branching like
`build_items_view` already does for the character-scoped route:

```python
@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; POST authorization is enforced inline via
# GameItemCreatePermission.check().
@permission_classes([AllowAny])
def game_items(request, game_slug):
    """Return a paginated list of non-hidden items for a game, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'POST':
        return game_item_create(request, game)
    items = game.items.filter(hidden=False)
    return paginated_list_response(request, items, GameItemListSerializer)
```

(import `game_item_create` from the new `_item_create` module)

### Step 4 — Add `can_create_item` to `GamePermissionsSerializer`

In `backend/games/serializers/games/game_permissions.py`, mirror
`CharacterPermissionsSerializer`'s `to_representation`/`_get_can_create_item` shape:

```python
from games.permissions import GameItemCreatePermission

class GamePermissionsSerializer(BasePermissionsSerializer):
    def to_representation(self, obj):
        data = super().to_representation(obj)
        data['can_create_item'] = self._get_can_create_item(obj)
        return data

    def _get_can_edit(self, game):
        ...  # unchanged

    def _get_can_create_item(self, game):
        if game is None:
            return False
        roles = self._roles()
        if roles is not None:
            return GameItemCreatePermission.is_allowed_for_roles(
                roles['is_superuser'], roles['is_dm'], roles['is_staff'],
            )
        return GameItemCreatePermission.is_allowed(self._user(), game)
```

### Step 5 — Tests

- `backend/games/tests/permissions_test.py`: add coverage for `GameItemCreatePermission.is_allowed`
  (dm/admin/staff → True; plain player/anonymous → False) and `is_allowed_for_roles`.
- `backend/games/tests/views/games/game_items_test.py`: add `POST` cases — `201` creates a
  `GameItem` only (assert no `CharacterItem` row is created), response body has `id` (not
  `game_item_id`); `400` on missing `name`; `401` unauthenticated; `403` for an authenticated
  non-privileged user; `201` for dm/admin/staff.
- `backend/games/tests/views/games/game_permissions_test.py`: add `can_create_item` assertions
  (dm/admin/staff → true, plain player/anonymous → false), including the role-simulated `?role=`
  path.

## Files to Change

- `backend/games/permissions.py` — add `GameItemCreatePermission`.
- `backend/games/views/games/_item_create.py` — new file, create-only implementation.
- `backend/games/views/games/game_items.py` — accept `POST`, branch to the new create function.
- `backend/games/serializers/games/game_permissions.py` — add `can_create_item`.
- `backend/games/tests/permissions_test.py` — new permission tests.
- `backend/games/tests/views/games/game_items_test.py` — new `POST` endpoint tests.
- `backend/games/tests/views/games/game_permissions_test.py` — new `can_create_item` tests.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — covers `views/games/game_items.py` and `game_permissions.py` tests.
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers
  `permissions_test.py`.
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- No migration needed — reuses the existing `GameItem` model as-is (no new fields).
- Do not reuse `GameItemPhotoUploadPermission`'s `_is_allowed` shape for this — that one also
  allows any player of the game, which is broader than the issue's explicit "dm, admin and
  staff" ask.
