"""View for the PC access-check endpoint."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ...serializers import PcAccessSerializer
from ..common import access_response
from ._shared import _find_character


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_pc_access(request, game_slug, character_id):
    """Return whether the requesting user may edit a specific PC."""
    game = Game.objects.filter(game_slug=game_slug).first()
    character = _find_character(game, character_id, npc=False)
    return access_response(PcAccessSerializer, character, request, context_extra={'game': game})
