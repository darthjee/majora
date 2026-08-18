"""View for listing a game's possessions."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ...models import Game
from ...serializers import GamePossessionListSerializer
from ..common import paginated_list_response
from ._possession_create import game_possession_create


@api_view(['GET', 'POST'])
# AllowAny: GET is intentionally public; POST authorization is enforced inline via
# EndpointPermission.check().
@permission_classes([AllowAny])
def game_possessions(request, game_slug):
    """Return a paginated list of non-hidden possessions for a game, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)
    if request.method == 'POST':
        return game_possession_create(request, game)
    possessions = game.possessions.filter(hidden=False)
    return paginated_list_response(request, possessions, GamePossessionListSerializer)
