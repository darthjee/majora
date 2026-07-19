"""View for listing a game's treasures, or creating one exclusive to that game."""

from django.db.models import Exists, IntegerField, OuterRef, Subquery
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game, GameTreasure, Treasure
from ...permissions import GameEditPermission
from ...serializers import (
    TreasureCreateSerializer,
    TreasureDetailSerializer,
    TreasureListSerializer,
)
from ..common import paginated_list_response, validate_with_hidden_field
from ._treasure_context import game_treasures_context
from ._treasure_filters import filter_by_max_value, filter_by_min_value, filter_by_name


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; POST authorization is enforced inline
# inside _create_game_treasure via GameEditPermission.check().
@permission_classes([AllowAny])
def game_treasures(request, game_slug):
    """Return a paginated list of treasures for a specific game, or create one."""
    game = get_object_or_404(Game, game_slug=game_slug)

    if request.method == 'POST':
        return _create_game_treasure(request, game)

    treasures = Treasure.objects.for_game(game)
    treasures = _exclude_hidden(game, treasures)
    game_value = Subquery(
        GameTreasure.objects.filter(game=game, treasure=OuterRef('pk')).values('value')[:1],
        output_field=IntegerField(),
    )
    treasures = treasures.annotate(game_value=Coalesce(game_value, 'value'))
    treasures = filter_by_min_value(request, treasures)
    treasures = filter_by_max_value(request, treasures)
    treasures = filter_by_name(request, treasures)
    treasures = _apply_ordering(request, treasures)
    context = game_treasures_context(game)
    return paginated_list_response(request, treasures, TreasureListSerializer, context=context)


def _exclude_hidden(game, treasures):
    """Exclude treasures whose GameTreasure row (for `game`) is hidden."""
    hidden_game_treasure = GameTreasure.objects.filter(
        game=game, treasure=OuterRef('pk'), hidden=True,
    )
    return treasures.exclude(Exists(hidden_game_treasure))


def _apply_ordering(request, treasures):
    """Order `treasures` by `value` descending when `ordering` is `desc`, ascending otherwise."""
    ordering = request.GET.get('ordering')
    if ordering == 'desc':
        return treasures.order_by('-game_value', 'id')

    return treasures.order_by('game_value', 'id')


def _create_game_treasure(request, game):
    """Validate the request and create a treasure exclusive to `game`, returning 201 detail."""
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    serializer = TreasureCreateSerializer(data=request.data)
    hidden_serializer, error_response = validate_with_hidden_field(serializer, request.data)
    if error_response:
        return error_response

    treasure = serializer.save(game=game, game_type=game.game_type)
    hidden = hidden_serializer.validated_data.get('hidden', False)
    GameTreasure.objects.create(
        game=game, treasure=treasure, value=treasure.value, hidden=hidden,
    )
    detail = TreasureDetailSerializer(treasure)
    return Response(detail.data, status=201)
