"""View for the NPC slain toggle endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ._slain_set import character_slain_set


@api_view(['PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_npc_slain_set(request, game_slug, character_id):
    """Toggle the slain flag on an NPC."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_slain_set(request, game, character_id, npc=True)
