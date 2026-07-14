"""View for the NPC photo upload init endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ._photo_upload import character_photo_upload


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_npc_photo_upload(request, game_slug, character_id):
    """Initialise an NPC photo upload and return the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_photo_upload(request, game, game_slug, character_id, npc=True)
