"""View for the game access-check endpoint."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ...serializers import GameAccessSerializer
from ..common import access_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_access(request, game_slug):
    """Return whether the requesting user may edit a specific game."""
    game = Game.objects.filter(game_slug=game_slug).first()
    return access_response(GameAccessSerializer, game, request)
