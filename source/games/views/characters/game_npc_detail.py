"""View for retrieving a single NPC's detail."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ._detail import character_detail


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_npc_detail(request, game_slug, character_id):
    """Return detail for a specific NPC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_detail(request, game, character_id, npc=True, check_hidden=True)
