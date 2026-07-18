"""View for listing catalog treasures not yet linked to a game — DM/superuser only."""

from django.db.models import Exists, OuterRef
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Game, GameTreasure, Treasure
from ...permissions import GameEditPermission
from ...serializers import TreasureListSerializer
from ..common import paginated_list_response
from ._treasure_context import game_treasures_context


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization for this whole endpoint is enforced inline via
# GameEditPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_treasures_missing(request, game_slug):
    """Return catalog treasures of the game's game_type not yet linked to it."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    treasures = Treasure.objects.filter(game_type=game.game_type, game__isnull=True)
    treasures = treasures.exclude(
        Exists(GameTreasure.objects.filter(game=game, treasure=OuterRef('pk'))),
    )
    context = game_treasures_context(game)
    response = paginated_list_response(request, treasures, TreasureListSerializer, context=context)
    response['X-Skip-Cache'] = 'true'
    return response
