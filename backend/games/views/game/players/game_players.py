"""View for listing a game's players."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from permissions import EndpointPermission

from ....models import Game
from ....serializers import PlayerListSerializer
from ...common import paginated_list_response


@api_view(['GET'])
# AllowAny: authorisation is enforced inline below via EndpointPermission.check(), since
# Players have no public read path.
@permission_classes([AllowAny])
def game_players(request, game_slug):
    """Return a paginated list of a game's players."""
    game = get_object_or_404(Game, game_slug=game_slug)

    error_response = EndpointPermission(request.user, game=game).check(
        request, 'player', 'regular', 'show',
    )
    if error_response:
        return error_response

    response = paginated_list_response(request, game.players.all(), PlayerListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
