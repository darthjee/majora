"""View for the PC faction membership summary endpoint — open to everyone."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ......decorators import regular, skip_cache
from ......models import Game
from ...._faction_summary import character_faction_summary


@regular
@skip_cache
@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_pc_faction_summary(request, game_slug, faction_id, character_id):
    """Return whether a specific PC belongs to a GameFaction, as {'enlisted': <bool>}."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_faction_summary(
        request, game, character_id, faction_id, npc=False, check_hidden=False,
        allow_hidden=False,
    )
