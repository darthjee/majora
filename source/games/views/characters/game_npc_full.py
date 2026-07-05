"""View for the full (private-description-included) NPC detail endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Character, Game
from ...permissions import CharacterEditPermission
from ...serializers import CharacterFullSerializer


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_npc_full(request, game_slug, character_id):
    """Return full detail (including private description) for a specific NPC."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=True)
    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response
    serializer = CharacterFullSerializer(character, context={'request': request})
    response = Response(serializer.data)
    response['X-Skip-Cache'] = 'true'
    return response
