"""View for a game treasure's full detail (including `hidden`) — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...models import Game
from ...serializers import TreasureFullSerializer
from ..common import check_game_edit
from .game_treasure_detail import _get_game_treasure_or_404


@api_view(['GET'])
# AllowAny: authorization for this whole endpoint is enforced inline via check_game_edit(),
# checked before the treasure is resolved so a 401/403 never reveals whether it exists.
@permission_classes([AllowAny])
def game_treasure_full(request, game_slug, treasure_id):
    """Return a game treasure's detail plus `hidden`, even when hidden — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response
    treasure = _get_game_treasure_or_404(game, treasure_id)
    response = Response(TreasureFullSerializer(treasure, context={'game': game}).data)
    response['X-Skip-Cache'] = 'true'
    return response
