"""View for the game permissions-check endpoint."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ...serializers import GamePermissionsSerializer
from ..common import parse_role_booleans, permissions_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_permissions(request, game_slug):
    """Return whether the requester (real or role-simulated) may edit a specific game."""
    game = Game.objects.filter(game_slug=game_slug).first()
    role_booleans = parse_role_booleans(request)
    return permissions_response(GamePermissionsSerializer, game, request, role_booleans)
