"""View for retrieving a single player's detail."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ....authentication import CookieTokenAuthentication
from ....models import Game
from ....permissions import PlayerPermission
from ....serializers import PlayerListSerializer
from ...common import access_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via PlayerPermission.check(), since
# Players have no public read path.
@permission_classes([AllowAny])
def game_player_detail(request, game_slug, player_id):
    """Return detail for a single player of a game."""
    game = get_object_or_404(Game, game_slug=game_slug)

    error_response = PlayerPermission.check(request, game)
    if error_response:
        return error_response

    player = get_object_or_404(game.players, id=player_id)
    return access_response(PlayerListSerializer, player, request)
