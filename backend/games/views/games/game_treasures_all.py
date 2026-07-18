"""View for listing all treasures (including hidden) in a game — DM/superuser only."""

from django.db.models import IntegerField, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Game, GameTreasure, Treasure
from ...permissions import GameEditPermission
from ...serializers import TreasureAllListSerializer
from ..common import paginated_list_response
from ._treasure_context import game_treasures_context
from ._treasure_filters import filter_by_max_value, filter_by_min_value, filter_by_name


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization for this whole endpoint is enforced inline via
# GameEditPermission.check(), so unauthenticated/non-DM callers get the app's own
# 401/403 payload instead of DRF's default.
@permission_classes([AllowAny])
def game_treasures_all(request, game_slug):
    """Return all treasures (including hidden) for a game — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response
    treasures = Treasure.objects.filter(Q(linked_game=game) | Q(game=game)).distinct()
    treasures = _annotate_game_value(game, treasures)
    treasures = filter_by_min_value(request, treasures)
    treasures = filter_by_max_value(request, treasures)
    treasures = filter_by_name(request, treasures)
    context = game_treasures_context(game)
    response = paginated_list_response(
        request, treasures, TreasureAllListSerializer, context=context,
    )
    response['X-Skip-Cache'] = 'true'
    return response


def _annotate_game_value(game, treasures):
    """Annotate `treasures` with `game_value`, the per-game override value or the base value."""
    game_value = Subquery(
        GameTreasure.objects.filter(game=game, treasure=OuterRef('pk')).values('value')[:1],
        output_field=IntegerField(),
    )
    return treasures.annotate(game_value=Coalesce(game_value, 'value'))
