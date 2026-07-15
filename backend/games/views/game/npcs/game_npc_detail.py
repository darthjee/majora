"""View for retrieving a single NPC's detail, or narrowly updating its player-facing fields."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ....authentication import CookieTokenAuthentication
from ....models import Game
from .._detail import character_detail
from ._npc_player_update import npc_player_update


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_npc_detail(request, game_slug, character_id):
    """Return NPC detail (GET), or apply the narrow player-facing update (PATCH)."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'PATCH':
        return npc_player_update(request, game, character_id)
    return character_detail(request, game, character_id, npc=True, check_hidden=True)
