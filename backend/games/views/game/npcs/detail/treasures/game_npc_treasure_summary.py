"""View for the NPC treasure quantity summary endpoint — open to everyone."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ......decorators import regular, skip_cache
from ......models import Game
from ...._treasure_summary import character_treasure_summary


@regular
@skip_cache
@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_npc_treasure_summary(request, game_slug, treasure_id, character_id):
    """Return how many of a Treasure a specific NPC owns, as {'quantity': <int>}."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_treasure_summary(
        request, game, character_id, treasure_id, npc=True, check_hidden=True,
    )
