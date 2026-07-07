"""View for retrieving or updating a single PC's detail."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ._detail import character_detail


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_pc_detail(request, game_slug, character_id):
    """Return or update detail for a specific PC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_detail(request, game, character_id, npc=False, check_hidden=False)
