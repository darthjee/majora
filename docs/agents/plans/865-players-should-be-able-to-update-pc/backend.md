# Backend Plan: Players should be able to update PC

Main plan: [plan.md](plan.md)

## Shared contracts

- Must produce: `PATCH /games/:game_slug/pcs/:id.json` (the existing, currently `GET`-only,
  plain PC detail route), accepting `name`, `role`, `public_description`, `money`, `links`, and
  returning the same `CharacterDetailSerializer` body the `GET` branch of this same route
  already returns.
- Permission for the new endpoint: superuser, staff (`user.is_staff`, global), GameMaster of the
  game, the PC's owning player, or any other player of the game — i.e. `CharacterEditPermission`'s
  access plus the same "staff + any player of the game, PC-only" broadening
  `CharacterMoneyEditPermission` already applies to `money.json` (issues #615/#625).
- `full.json`'s permission (`CharacterEditPermission`) and field set
  (`CharacterUpdateSerializer`) must not change at all.
- Frontend relies on `character.can_edit`/`is_player`/`is_staff` (already exposed today via
  `access.json`/`permissions.json`) to decide which of the two endpoints to call — no new
  serializer field is needed on the identity/access side for this issue.

## Implementation Steps

### Step 1 — New permission class: `CharacterRegularEditPermission`

Add to `backend/games/permissions.py`, near `CharacterMoneyEditPermission` (whose shape it
mirrors exactly):

```python
class CharacterRegularEditPermission(_EditPermission):
    """Encapsulate checks for the narrow, player-writable PC update endpoint (issue #865).

    Grants the same access as CharacterEditPermission (superuser, the character's owning
    player, or a GameMaster of the game) plus any Staff account (globally), plus — PC-only —
    any other player of the game. Deliberately mirrors CharacterMoneyEditPermission's exact
    shape (issues #615/#625) rather than reusing that class directly, so the two endpoints'
    rules can diverge independently later, per this module's existing convention (see
    CharacterItemCreatePermission/CharacterItemPhotoUploadPermission). PC-only: NPCs have no
    counterpart to this endpoint at all.
    """

    @classmethod
    def check(cls, request, character):
        """Return an error Response if `request.user` may not perform this PC update."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        """Return whether `user` may edit `character`'s regular (non-private) field set."""
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        if character.is_pc and character.game.has_player(user):
            return True
        return character.can_be_edited_by(user)
```

### Step 2 — New serializer: `CharacterRegularUpdateSerializer`

Add `backend/games/serializers/characters/character_regular_update.py`, mirroring
`character_update.py`'s `links` handling but with the narrower field set:

```python
"""Character regular (player-writable) update serializer for the games app."""

from rest_framework import serializers

from games.models import Character
from games.serializers.characters.character_link_write import (
    CharacterLinksSync,
    CharacterLinkWriteSerializer,
    validate_links_count,
)


class CharacterRegularUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the narrow, player-writable PC update endpoint (issue #865)."""

    links = CharacterLinkWriteSerializer(many=True, required=False)

    class Meta:
        """Metadata for the CharacterRegularUpdateSerializer."""

        model = Character
        fields = ['name', 'role', 'public_description', 'money', 'links']
        extra_kwargs = {
            field: {'required': False} for field in fields if field != 'links'
        }

    def validate_links(self, value):
        """Reject a `links` payload with more entries than `CharacterLinksSync` should batch."""
        return validate_links_count(value)

    def update(self, instance, validated_data):
        """Update the character's scalar fields, then sync its `links` per entry."""
        links = validated_data.pop('links', [])
        instance = super().update(instance, validated_data)
        CharacterLinksSync(instance, links).apply()
        return instance
```

Register it in `backend/games/serializers/__init__.py` (import + `__all__`), next to
`CharacterUpdateSerializer`.

While here: `CharacterUpdateSerializer`'s docstring ("Serializer for the limited set of fields a
player may edit on their PC") is now misleading — it's the *full* field set, and the genuinely
narrower one is this new serializer. Fix the docstring in the same PR (non-blocking, but cheap
to do while the two serializers sit side by side).

### Step 3 — New shared view implementation: `character_regular_update`

Add `backend/games/views/game/_regular.py`, mirroring `_money.py`'s shape:

```python
"""Shared implementation for the PC-only, player-writable regular update endpoint (issue #865)."""

from ...permissions import CharacterRegularEditPermission
from ...serializers import CharacterDetailSerializer, CharacterRegularUpdateSerializer
from ..common import detail_or_update


def character_regular_update(request, character):
    """Update the narrow, player-writable field set for a PC."""
    response = detail_or_update(
        request, character, CharacterRegularEditPermission,
        CharacterRegularUpdateSerializer, CharacterDetailSerializer,
        detail_context={'request': request},
    )
    response['X-Skip-Cache'] = 'true'
    return response
```

(`detail_or_update` already handles the permission-check-then-save flow; see `_full.py` for the
identical pattern currently used by `full.json`.)

### Step 4 — Wire `PATCH` into `game_pc_detail.py`

`backend/games/views/game/pcs/game_pc_detail.py` currently only accepts `GET` (`AllowAny`) and
always calls `character_detail`. Add a `PATCH` branch, **PC-only** — do not touch
`game_npc_detail.py` or the shared `character_detail`/`_detail.py` GET implementation, which stay
exactly as they are:

```python
"""View for retrieving or updating a single PC's detail."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ....models import Game
from .._detail import character_detail
from .._regular import character_regular_update
from .._shared import _get_character_or_404


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_pc_detail(request, game_slug, character_id):
    """Return, or update the player-writable field set for, a specific PC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'PATCH':
        character = _get_character_or_404(game, character_id, npc=False)
        return character_regular_update(request, character)
    return character_detail(request, game, character_id, npc=False, check_hidden=False)
```

Real authorization happens inside `character_regular_update` (via `CharacterRegularEditPermission`),
same pattern as every other endpoint in this app — the decorator-level permission stays `AllowAny`.

### Step 5 — Tests

- `backend/games/tests/permissions_test.py` (or a dedicated block there): unit-test
  `CharacterRegularEditPermission.is_allowed` — superuser, staff, GameMaster, owning player, any
  other player of the PC's game all `True`; an unrelated authenticated user and an anonymous user
  `False`; confirm it is **not** granted for an NPC (`character.is_pc == False`) beyond what
  `can_be_edited_by` already grants (no PC-only leniency bleeding into NPCs).
- `backend/games/tests/views/game/pcs/game_pc_detail_test.py`: add `PATCH` coverage next to the
  existing `GET` tests — success for each of the five newly-allowed roles (dm, admin/superuser,
  owner, any other player of the game, staff), a 403 for an unrelated authenticated user, a 401
  for anonymous, a 400 for an invalid payload (e.g. `links` over the batch cap), and confirm
  `private_description`/`hidden`/`allegiance` in the payload are silently ignored (not on the
  serializer's `fields`) rather than erroring.
- `backend/games/tests/serializers/characters/character_regular_update_test.py`: mirror
  `character_update_test.py`'s shape for the narrower field list, including the `links` sync
  behavior.
- Confirm `backend/games/tests/views/game/npcs/game_npc_detail_test.py` and
  `full`/`money` PC/NPC test suites are unaffected (no regression) — no changes expected there.

## Files to Change

- `backend/games/permissions.py` — add `CharacterRegularEditPermission`.
- `backend/games/serializers/characters/character_regular_update.py` — new
  `CharacterRegularUpdateSerializer`.
- `backend/games/serializers/__init__.py` — export the new serializer.
- `backend/games/serializers/characters/character_update.py` — docstring fix only (no field
  changes).
- `backend/games/views/game/_regular.py` — new `character_regular_update` shared implementation.
- `backend/games/views/game/pcs/game_pc_detail.py` — add the `PATCH` branch.
- `backend/games/tests/permissions_test.py` — new permission unit tests.
- `backend/games/tests/views/game/pcs/game_pc_detail_test.py` — new `PATCH` endpoint tests.
- `backend/games/tests/serializers/characters/character_regular_update_test.py` — new serializer
  tests.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov` (CI job: `pytest_views_characters`)
- `backend`: `poetry run pytest games/tests/ --ignore=games/tests/views/ --cov` (CI job:
  `pytest_all`, covers the new serializer/permission unit tests)

## Notes

- `CharacterRegularEditPermission.is_allowed` is intentionally byte-for-byte identical to
  `CharacterMoneyEditPermission.is_allowed` today. This repo's established convention (see
  `CharacterItemCreatePermission`/`CharacterItemPhotoUploadPermission`'s docstrings) is to keep
  such rules as separate classes even when currently identical, so each endpoint's authorization
  can diverge independently later — do not collapse them into one shared class.
- Consider whether `data-access`/`security` review (already part of this project's standard
  pipeline for new endpoints/permission changes) should specifically double check that
  `character.is_pc` is checked before the "any player of the game" branch, so this leniency never
  accidentally reaches NPCs through some future refactor.
