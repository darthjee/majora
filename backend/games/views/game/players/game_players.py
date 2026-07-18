"""View for listing a game's players."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ....authentication import CookieTokenAuthentication
from ....models import Game
from ....permissions import PlayerPermission
from ....serializers import PlayerListSerializer
from ...common import paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via PlayerPermission.check(), since
# Players have no public read path.
@permission_classes([AllowAny])
def game_players(request, game_slug):
    """Return a paginated list of a game's players."""
    game = get_object_or_404(Game, game_slug=game_slug)

    error_response = PlayerPermission.check(request, game)
    if error_response:
        return error_response

    response = paginated_list_response(request, game.players.all(), PlayerListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
