"""View for the DM-only PC treasure acquire-all endpoint (accepts hidden treasures)."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ......authentication import CookieTokenAuthentication
from ......models import Game
from ......permissions import GameEditPermission
from ...._shared import _get_character_or_404
from ...._treasure_exchange import character_treasure_acquire


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization is enforced inline, both via GameEditPermission.check() below and
# CharacterEditPermission.check() inside character_treasure_acquire.
@permission_classes([AllowAny])
def game_pc_treasure_acquire_all(request, game_slug, character_id):
    """Spend a PC's money to acquire a treasure, including hidden ones — DM/superuser only.

    Additionally gated by `GameEditPermission`, on top of the `CharacterEditPermission` check
    already performed inside `character_treasure_acquire`, so a DM may act on behalf of any
    PC/NPC in their game.
    """
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response
    character = _get_character_or_404(game, character_id, npc=False)

    return character_treasure_acquire(request, game, character, allow_hidden=True)
