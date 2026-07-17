# Backend Plan: Staff Can Edit Pc Money

Main plan: [plan.md](plan.md)

## Shared contracts

- New endpoints: `PUT /games/<slug>/pcs/<id>/money.json`, `PUT /games/<slug>/npcs/<id>/money.json`
  (note the `.json` suffix — the issue text omits it, but every route in this codebase requires
  it for Tent to route to Django).
- Request body: `{"money": <non-negative integer>}`, required.
- Authorization: superuser, that game's DM, any Staff account (`user.is_staff`, global), or —
  PCs only — the PC's own owning player. Implement as `user.is_staff or
  character.can_be_edited_by(user)`.
- Success response: `200` with `CharacterDetailSerializer` body, `X-Skip-Cache: true` header.
- New `can_edit_money` boolean field on `CharacterDetailSerializer` (inherited by
  `CharacterFullSerializer`), computed with the same rule as the endpoint's own authorization.

## Implementation Steps

### Step 1 — New permission class

Add `CharacterMoneyEditPermission` to `backend/games/permissions.py`, next to the existing
`CharacterPhotoUploadPermission` (issue #619) — same shape, but the allow rule has no "any
player of the game" branch (this issue explicitly restricts NPC money edits to admin/dm/staff,
never a regular player — see `docs/agents/product.md`'s existing "Editing Rules" section for the
precedent this mirrors and extends).

```python
class CharacterMoneyEditPermission(_EditPermission):
    """Encapsulate checks for the narrow, money-only character edit endpoint (issue #615).

    Grants the same access as full CharacterEditPermission (superuser, the character's
    owning player, or a GameMaster of the game) plus any Staff account (globally, not
    scoped to games the Staff user is otherwise involved in) — mirroring
    CharacterPhotoUploadPermission's Staff bypass (issue #619), but deliberately without its
    additional "any player of the game" grant: NPCs have no owner, so this stays
    admin/dm/staff-only for NPCs, and a regular player may only use it on their own PC (via
    the inherited owner check), never on an NPC.

    Exposes `is_allowed` as a public classmethod (unlike CharacterPhotoUploadPermission's
    private `_is_allowed`) because CharacterDetailSerializer's `can_edit_money` field needs
    the exact same rule, computed from a `request.user` that may be anonymous.
    """

    @classmethod
    def check(cls, request, character):
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not cls.is_allowed(request.user, character):
            return cls._forbidden_response()
        return None

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may edit `character`'s money (Staff bypass, or full edit rights)."""
        return bool(user and user.is_staff) or character.can_be_edited_by(user)
```

### Step 2 — New money-only update serializer

Add `backend/games/serializers/characters/character_money_update.py`:

```python
class CharacterMoneyUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the narrow, money-only character update endpoint (issue #615)."""

    class Meta:
        model = Character
        fields = ['money']
        extra_kwargs = {'money': {'required': True}}
```

`money` is a `PositiveIntegerField` on the model, so DRF already derives a `min_value=0`
validator — no extra validation needed. Export it from
`games/serializers/characters/__init__.py` and `games/serializers/__init__.py` (follow the
existing export pattern for `CharacterUpdateSerializer`).

### Step 3 — `can_edit_money` field

Add to `backend/games/serializers/characters/character_detail.py`:

```python
from games.permissions import CharacterMoneyEditPermission

...
can_edit_money = serializers.SerializerMethodField()

class Meta:
    fields = [..., 'can_edit_money']

def get_can_edit_money(self, obj):
    request = self.context.get('request')
    user = request.user if request else None
    return CharacterMoneyEditPermission.is_allowed(user, obj)
```

Since `CharacterFullSerializer` subclasses `CharacterDetailSerializer` and extends
`Meta.fields` additively, it inherits `can_edit_money` automatically — no change needed there.
Double check no circular import between `games/permissions.py` and
`games/serializers/characters/character_detail.py` (permissions.py has no serializer imports
today, so this should be a plain one-directional import).

### Step 4 — Shared view helper

Add `backend/games/views/game/_money.py` (sibling of the existing `_full.py`/`_shared.py`/
`_treasure_exchange.py`):

```python
"""Shared implementation for the character money-only update endpoint (issue #615)."""

from rest_framework.response import Response

from ...permissions import CharacterMoneyEditPermission
from ...serializers import CharacterDetailSerializer, CharacterMoneyUpdateSerializer
from ..common import save_or_error, validated_or_error


def character_money_update(request, character):
    """Update `character`'s money through the narrow, money-only PUT endpoint."""
    error_response = CharacterMoneyEditPermission.check(request, character)
    if error_response:
        return error_response

    serializer = CharacterMoneyUpdateSerializer(character, data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    _, error_response = save_or_error(serializer)
    if error_response:
        return error_response

    response = Response(CharacterDetailSerializer(character, context={'request': request}).data)
    response['X-Skip-Cache'] = 'true'
    return response
```

Note this uses a non-`partial` serializer (unlike `full.json`'s `_update`, which is `partial`)
since `money` is the only field and is required — a request with no `money` key should 400, not
silently no-op.

### Step 5 — Views + URLs

Add `backend/games/views/game/pcs/detail/game_pc_money.py`:

```python
"""View for the PC money-only update endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from .....authentication import CookieTokenAuthentication
from .....models import Game
from ...._money import character_money_update
from ...._shared import _get_character_or_404


@api_view(['PUT'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization is enforced inline via CharacterMoneyEditPermission.check().
@permission_classes([AllowAny])
def game_pc_money(request, game_slug, character_id):
    """Update a PC's money through the narrow money-only endpoint."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = _get_character_or_404(game, character_id, npc=False)
    return character_money_update(request, character)
```

Mirror for `backend/games/views/game/npcs/detail/game_npc_money.py` (`game_npc_money`,
`npc=True`).

Wire both into:
- `games/views/game/pcs/__init__.py` / `games/views/game/npcs/__init__.py`
- `games/views/game/__init__.py`
- `games/views/__init__.py`
(follow the exact existing pattern for `game_pc_full`/`game_npc_full` at each of these four
levels — same import style, same `__all__` list placement).

Add to `games/urls/pcs.py`:

```python
path(
    'games/<slug:game_slug>/pcs/<int:character_id>/money.json',
    views.game_pc_money,
    name='game-pc-money',
),
```

Mirror in `games/urls/npcs.py` (`game_npc_money`, `game-npc-money`).

### Step 6 — Tests

- `games/tests/permissions_test.py` — add a test class for `CharacterMoneyEditPermission`
  covering: superuser, DM, Staff, PC's owning player, a regular player on their own PC, a
  regular player on an NPC (denied), an unrelated authenticated user (denied), unauthenticated
  (401 via `.check`).
- `games/tests/views/game/pcs/detail/game_pc_money_test.py` (new, mirror
  `game_pc_full_test.py`'s structure): 200 + persisted money + response shape for each allowed
  role, 400 for missing/negative/non-integer `money`, 401/403/404 cases, and
  `X-Skip-Cache: true` header assertion.
- `games/tests/views/game/npcs/detail/game_npc_money_test.py` (new, mirror the PC one) — include
  a case proving a regular player of the game gets 403 on this route (the key NPC-specific
  restriction from the issue).
- `games/tests/serializers/characters/character_detail_test.py` — add cases for `can_edit_money`
  (true for Staff-only user, true for owner, false for unrelated player, false for
  unauthenticated) and confirm `CharacterFullSerializer` still includes it too (existing full
  serializer test file, add/extend a case there as well if one doesn't already assert the field
  set).

## Files to Change

- `backend/games/permissions.py` — add `CharacterMoneyEditPermission`
- `backend/games/serializers/characters/character_money_update.py` — new
- `backend/games/serializers/characters/__init__.py` — export new serializer
- `backend/games/serializers/__init__.py` — export new serializer
- `backend/games/serializers/characters/character_detail.py` — add `can_edit_money`
- `backend/games/views/game/_money.py` — new
- `backend/games/views/game/pcs/detail/game_pc_money.py` — new
- `backend/games/views/game/npcs/detail/game_npc_money.py` — new
- `backend/games/views/game/pcs/__init__.py`, `backend/games/views/game/npcs/__init__.py`,
  `backend/games/views/game/__init__.py`, `backend/games/views/__init__.py` — wire up new views
- `backend/games/urls/pcs.py`, `backend/games/urls/npcs.py` — new `money.json` routes
- `backend/games/tests/permissions_test.py` — new test class
- `backend/games/tests/views/game/pcs/detail/game_pc_money_test.py` — new
- `backend/games/tests/views/game/npcs/detail/game_npc_money_test.py` — new
- `backend/games/tests/serializers/characters/character_detail_test.py` — extend

## CI Checks

- `backend`: `docker-compose run backend poetry run pytest games/tests/views/game/ games/tests/permissions_test.py games/tests/serializers/ --cov` (CI jobs: `pytest_views_characters`, `pytest_all`)
- `backend`: `docker-compose run backend poetry run ruff check .` (CI job: `checks`)

## Notes

- Do not use `detail_or_update`'s `partial=True` PATCH path for this — this is a dedicated PUT
  with `money` required, not an optional partial field.
- Keep `CharacterMoneyEditPermission.is_allowed` public (no leading underscore) specifically so
  the serializer can reuse it without duplicating the rule.
