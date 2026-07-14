"""View for the full (private-description-included) PC detail endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from .....authentication import CookieTokenAuthentication
from .....models import Game
from ..._full import character_full


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_pc_full(request, game_slug, character_id):
    """Return or update full detail (including private description) for a specific PC."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_full(request, game, character_id, npc=False)
