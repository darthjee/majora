"""View for the game access-check endpoint."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ...models import Game
from ...serializers import GameAccessSerializer
from ..common import access_response


@api_view(['GET'])
@permission_classes([AllowAny])
def game_access(request, game_slug):
    """Return whether the requesting user may edit a specific game."""
    game = Game.objects.filter(game_slug=game_slug).first()
    return access_response(GameAccessSerializer, game, request)
