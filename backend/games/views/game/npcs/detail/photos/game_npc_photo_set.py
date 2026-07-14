"""View for the NPC photo set (role update) endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

from ......authentication import CookieTokenAuthentication
from ......models import Game
from ...._photo_set import character_photo_set


@api_view(['PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_npc_photo_set(request, game_slug, character_id, photo_id):
    """Update roles (e.g. profile) on an NPC's photo."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_photo_set(request, game, character_id, photo_id, npc=True)
