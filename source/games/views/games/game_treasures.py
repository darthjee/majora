"""View for listing a game's treasures, or creating one exclusive to that game."""

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, Treasure
from ...permissions import GameEditPermission
from ...serializers import (
    TreasureCreateSerializer,
    TreasureDetailSerializer,
    TreasureListSerializer,
)
from ..common import paginated_list_response, validated_or_error
from ._treasure_context import game_treasures_context


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

    treasures = Treasure.objects.filter(Q(linked_game=game) | Q(game=game)).distinct()
    treasures = treasures.filter(hidden=False)
    treasures = _filter_by_max_value(request, treasures)
    context = game_treasures_context(game)
    return paginated_list_response(request, treasures, TreasureListSerializer, context=context)


def _filter_by_max_value(request, treasures):
    """Filter `treasures` to `value__lte` an optional `max_value` query param."""
    max_value = request.GET.get('max_value')
    if max_value is None:
        return treasures

    try:
        max_value = int(max_value)
    except ValueError:
        return treasures

    return treasures.filter(value__lte=max_value)


def _create_game_treasure(request, game):
    """Validate the request and create a treasure exclusive to `game`, returning 201 detail."""
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    serializer = TreasureCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    treasure = serializer.save(game=game)
    detail = TreasureDetailSerializer(treasure)
    return Response(detail.data, status=201)
