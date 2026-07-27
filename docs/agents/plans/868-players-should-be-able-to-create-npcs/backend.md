# Backend Plan: Players should be able to create NPCs

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the exact new route, permission class, serializer
field set, and `can_create_npc` flag this plan produces — the frontend plan consumes all of them
as-is.

## Implementation Steps

### Step 1 — Add `NpcPlayerCreatePermission`

In `backend/games/permissions.py`, add a new class near `GameItemCreatePermission`/
`GameDocumentCreatePermission` (same file section, same shape):

```python
class NpcPlayerCreatePermission(_EditPermission):
    """Encapsulate checks for the player-facing NPC-creation endpoint (issue #868).

    Grants the same access as GameEditPermission (superuser or a GameMaster of the game) plus
    any Staff account (globally) plus any player of the game — mirroring GameItemCreatePermission/
    GameDocumentCreatePermission's shape, since a to-be-created NPC has no owning character yet.
    """

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not create an NPC for `game`."""
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, game))

    @classmethod
    def is_allowed(cls, user, game):
        """Return whether `user` may create a new player-facing NPC for `game`."""
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)

    @classmethod
    def is_allowed_for_roles(cls, is_superuser, is_dm, is_staff, is_player):
        """Return whether a role-simulated caller may create a new player-facing NPC."""
        return is_staff or is_superuser or is_dm or is_player
```

### Step 2 — Add `NpcPlayerCreateSerializer`

New file `backend/games/serializers/characters/npcs/npc_player_create.py`, mirroring
`CharacterCreateSerializer`'s `create()`/links handling but with `NpcPlayerUpdateSerializer`'s
narrower field set:

```python
"""Player-facing create serializer for the reduced NPC creation endpoint."""

from rest_framework import serializers

from games.models import Character
from games.serializers.characters.character_link_write import (
    CharacterLinksSync,
    CharacterLinkWriteSerializer,
    validate_links_count,
)


class NpcPlayerCreateSerializer(serializers.ModelSerializer):
    """Validate the narrow player-facing NPC creation payload, writing only its curated fields.

    Deliberately narrower than `CharacterCreateSerializer`: this only ever maps `name`, `role`,
    `public_description`, `public_allegiance`, `public_slain`, and `links` — `money`,
    `private_description`, `private_allegiance`, and `hidden` stay `npcs/full.json`-only, and are
    not declared here at all, so a player payload can never write them regardless of what keys it
    sends.
    """

    links = CharacterLinkWriteSerializer(many=True, required=False)

    class Meta:
        """Metadata for the NpcPlayerCreateSerializer."""

        model = Character
        fields = [
            'name', 'role', 'public_description', 'public_allegiance', 'public_slain', 'links',
        ]
        extra_kwargs = {
            'name': {'required': True},
            'role': {'required': False},
            'public_description': {'required': False},
            'public_allegiance': {'required': False},
            'public_slain': {'required': False},
        }

    def validate_links(self, value):
        """Reject a `links` payload with more entries than `CharacterLinksSync` should batch."""
        return validate_links_count(value)

    def create(self, validated_data):
        """Create the character, then create a `CharacterLink` for each entry in `links`."""
        links = validated_data.pop('links', [])
        character = super().create(validated_data)
        CharacterLinksSync(character, links).create_all()
        return character
```

Export it from `backend/games/serializers/__init__.py` (alongside the existing
`NpcPlayerUpdateSerializer`/`CharacterCreateSerializer` imports and `__all__` entries).

### Step 3 — Split the view

`backend/games/views/game/npcs/game_npcs.py`'s `_create_npc` currently does `GameEditPermission.
check` + `CharacterCreateSerializer`. Change it to `NpcPlayerCreatePermission.check` +
`NpcPlayerCreateSerializer` — everything else (the `save_or_error(serializer, game=game,
npc=True)` call, the `CharacterDetailSerializer` 201 response, the `X-Skip-Cache` header, the
docstring's cache-safety rationale) stays as-is.

Add a new file `backend/games/views/game/npcs/game_npcs_full.py` (mirroring
`game_npcs_all.py`'s shape, POST instead of GET, no list logic):

```python
"""View for creating an NPC with the full (private-field-included) field set — DM/admin only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ....models import Game
from ....permissions import GameEditPermission
from ....serializers import CharacterCreateSerializer, CharacterDetailSerializer
from ...common import save_or_error, validated_or_error


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_npcs_full(request, game_slug):
    """Create a new NPC with the full field set for a game — DM/admin/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    serializer = CharacterCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    character, error_response = save_or_error(serializer, game=game, npc=True)
    if error_response:
        return error_response
    detail = CharacterDetailSerializer(character, context={'request': request})
    response = Response(detail.data, status=201)
    response['X-Skip-Cache'] = 'true'
    return response
```

This duplicates `_create_npc`'s current body verbatim under the unchanged permission/serializer —
deliberate, since `_create_npc` itself is being repointed at the new permission/serializer in the
same step and the two bodies diverge from here on.

Wire it up:
- `backend/games/views/game/npcs/__init__.py`: import `game_npcs_full` from
  `.game_npcs_full`, add it to `__all__`.
- `backend/games/urls/npcs.py`: add
  `path('games/<slug:game_slug>/npcs/full.json', views.game_npcs_full, name='game-npcs-full')`
  next to the existing `npcs.json`/`npcs/all.json` entries (before
  `build_character_urlpatterns(...)`, matching those two's ordering).

### Step 4 — Add the `can_create_npc` permissions flag

In `backend/games/serializers/games/game_permissions.py`, add a `_get_can_create_npc` method
mirroring `_get_can_create_item`/`_get_can_create_document` exactly, backed by
`NpcPlayerCreatePermission`, and wire it into `to_representation`:

```python
data['can_create_npc'] = self._get_can_create_npc(obj)
```

```python
def _get_can_create_npc(self, game):
    """Return whether the requester (real or role-simulated) may create a player-facing NPC."""
    if game is None:
        return False
    roles = self._roles()
    if roles is not None:
        return NpcPlayerCreatePermission.is_allowed_for_roles(
            roles['is_superuser'], roles['is_dm'], roles['is_staff'], roles['is_player'],
        )
    return NpcPlayerCreatePermission.is_allowed(self._user(), game)
```

Add `NpcPlayerCreatePermission` to the module's existing `from games.permissions import (...)`
block.

### Step 5 — Update access-control docs

`docs/agents/access-control/character.md`'s "Create" section: replace the single-row table with
two rows (mirroring "Narrow player-facing NPC PATCH"'s table style):

| Endpoint | Who can write |
|----------|--------------|
| `POST /games/<slug>/npcs.json` | **NpcPlayerCreate** |
| `POST /games/<slug>/npcs/full.json` | **GameEdit** |

Split the "Write fields" paragraph into two: the `npcs/full.json` paragraph keeps today's
existing full-field wording verbatim (renamed from `npcs.json`); a new paragraph for
`npcs.json` states its curated field set (`name` required, `role`, `public_description`,
`public_allegiance`, `public_slain`, `links` — all others optional), and explicitly notes
`hidden`/`private_description`/`private_allegiance`/`money` are not declared on
`NpcPlayerCreateSerializer` at all, so a player-created NPC can never carry them. Update the
"Create response" note to apply to both endpoints (both return the same
`CharacterDetailSerializer` 201 body). Add a one-line **NpcPlayerCreate** definition (mirroring
how **NpcPlayerEdit** is defined near "Narrow player-facing NPC PATCH"): grants the same access
as **GameEdit** plus any Staff account plus any player of the game.

`docs/agents/access-control/principles.md`'s "Partial vs full access pattern" table: fill in the
previously-empty Create row:

| Action | Partial route | Full route |
|--------|---------------|------------|
| Create | `POST ....json` (curated field set, broader-audience permission) | `POST .../full.json` |

## Tests

- Extend `backend/games/tests/permissions_test.py` with a `TestNpcPlayerCreatePermission` class,
  following the existing per-class structure (e.g. `TestGameItemCreatePermission`'s shape) —
  cover `is_allowed`/`is_allowed_for_roles` for superuser/dm/staff/player/unrelated-authenticated/
  unauthenticated.
- `backend/games/tests/views/game/npcs/game_npcs_test.py` (existing file, covers both list and
  create today): update its create tests so the existing dm/admin/superuser-success assertions
  now also cover staff and any-player-of-game success, and add a test confirming a
  player-submitted `hidden`/`private_description`/`private_allegiance`/`money` key is silently
  ignored (the created NPC does not carry it) rather than causing a 400.
- New `backend/games/tests/views/game/npcs/game_npcs_full_test.py`, mirroring
  `game_npcs_test.py`'s existing create tests verbatim (same fixtures/assertions) but hitting
  `/games/test-game/npcs/full.json` — this is exactly today's pre-#868 `npcs.json` create
  behavior, now relocated.
- New `backend/games/tests/serializers/characters/npcs/npc_player_create_test.py`, mirroring
  `npc_player_update_test.py`'s existing structure — cover required `name`, optional other
  fields, `links` create/count-limit behavior, and that `hidden`/`private_description`/
  `private_allegiance`/`money` are rejected as unknown fields with no effect (not merely
  defaulted) if sent.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_characters`
  covers `games/tests/views/game/`, `pytest_all` covers everything else including
  `games/tests/permissions_test.py` and `games/tests/serializers/`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- `CharacterCreateSerializer` itself is untouched — `npcs/full.json` reuses it verbatim, exactly
  as the issue requires ("unchanged from today's behavior").
- `_hidden_gate_response`-style pre-checks (used elsewhere for existing hidden NPCs) do not apply
  here — there is no existing NPC to gate on at creation time.
