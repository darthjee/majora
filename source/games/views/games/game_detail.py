"""View for retrieving or updating a single game's detail."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ...permissions import GameEditPermission
from ...serializers import GameDetailSerializer, GameUpdateSerializer
from ..common import detail_or_update


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_detail(request, game_slug):
    """Return or update detail for a specific game identified by game_slug."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return detail_or_update(
        request, game, GameEditPermission, GameUpdateSerializer, GameDetailSerializer
    )
