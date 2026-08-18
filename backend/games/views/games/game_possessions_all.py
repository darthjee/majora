"""View for listing all possessions (including hidden) in a game — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ...models import Game
from ...serializers import GamePossessionAllListSerializer
from ..common import check_game_edit, paginated_list_response


@api_view(['GET'])
# AllowAny: authorization for this whole endpoint is enforced inline via
# EndpointPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_possessions_all(request, game_slug):
    """Return all possessions (including hidden) for a game — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response
    possessions = game.possessions.all()
    response = paginated_list_response(request, possessions, GamePossessionAllListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
