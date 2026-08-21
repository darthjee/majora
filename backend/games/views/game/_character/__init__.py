"""Generic, cross-domain factories shared by every PC/NPC view pair (issue #690).

Every PC/NPC endpoint pair under `game/pcs/` and `game/npcs/` differs only by the `npc`
flag, and occasionally by a serializer/permission class — the actual endpoint logic already
lives in the `npc`-parameterized shared modules (`_detail.py`, `_full.py`, etc). These
factories collapse the remaining decorator/`get_object_or_404` boilerplate into a single,
`npc`-parameterized definition per endpoint shape, so the PC/NPC view modules become thin
one-line wrappers.

Domain-specific factories (photos, items, documents, factions, possessions, treasures) live
in their own `_*_shared.py` files alongside this one.
"""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from permissions import EndpointPermission

from ...models import Game
from ..common import access_response, check_game_edit
from ._full import character_full
from ._shared import _find_character, _get_character_or_404


def _build_api_view(methods, permission_class):
    """Return a decorator applying this app's standard trio of DRF view decorators."""

    def decorator(view):
        view = permission_classes([permission_class])(view)
        return api_view(methods)(view)

    return decorator


def _check_character_all_permission(request, game, character_id, npc):
    """Return an error Response if the requester may not view/edit all items/documents, else None.

    An NPC's `/items/all.json` (or `/documents/all.json`, or `/items/remove/all.json`) is
    DM/superuser-only (`game`/`restricted`/`edit`); a PC's own variant is additionally open to
    the PC's owning player (`game_pc`/`restricted`/`edit`). Shared by the items, documents, and
    (issue #773) item-remove `/all.json` view factories below — the branching is identical,
    only the calling endpoint differs.
    """
    if npc:
        return check_game_edit(request, game)
    character = _get_character_or_404(game, character_id, npc=False)
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, 'game_pc', 'restricted', 'edit',
    )


def build_access_view(npc, access_serializer_class):
    """Build the GET access-check view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return whether the requesting user may edit a specific PC/NPC."""
        game = Game.objects.filter(game_slug=game_slug).first()
        character = _find_character(game, character_id, npc=npc)
        return access_response(
            access_serializer_class, character, request, context_extra={'game': game}
        )

    return view


def build_full_view(npc):
    """Build the GET/PATCH full-detail view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET', 'PATCH'], AllowAny)
    def view(request, game_slug, character_id):
        """Return or update full detail (including private description) for a PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_full(request, game, character_id, npc=npc)

    return view
