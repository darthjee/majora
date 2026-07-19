"""View for listing all treasures or creating a new one."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game, Treasure
from ...serializers import (
    TreasureCreateSerializer,
    TreasureDetailSerializer,
    TreasureListSerializer,
)
from ..common import paginated_list_response, require_authenticated, validated_or_error
from ..games._treasure_filters import filter_by_max_value, filter_by_min_value, filter_by_name


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; POST authentication is enforced
# inline inside _create_treasure so unauthenticated callers receive a proper 401.
@permission_classes([AllowAny])
def treasures_list(request):
    """Return a list of all treasures or create a new treasure."""
    if request.method == 'POST':
        return _create_treasure(request)

    treasures = Treasure.objects.filter(game__isnull=True)
    treasures = _filter_by_game_type(request, treasures)
    treasures = filter_by_min_value(request, treasures, field='value')
    treasures = filter_by_max_value(request, treasures, field='value')
    treasures = filter_by_name(request, treasures)
    treasures = treasures.order_by('value', 'id')
    return paginated_list_response(request, treasures, TreasureListSerializer)


def _filter_by_game_type(request, treasures):
    """Filter `treasures` to an exact `game_type` match when it is a recognized choice."""
    game_type = request.GET.get('game_type')
    valid_game_types = {key for key, _label in Game.GAME_TYPE_CHOICES}
    if game_type not in valid_game_types:
        return treasures

    return treasures.filter(game_type=game_type)


def _create_treasure(request):
    """Validate request and create a new treasure, returning 201 with detail data."""
    error_response = require_authenticated(request)
    if error_response:
        return error_response

    if not (request.user.is_superuser or request.user.is_staff):
        return Response({'errors': {'detail': ['not allowed']}}, status=403)

    serializer = TreasureCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    treasure = serializer.save()
    detail = TreasureDetailSerializer(treasure)
    return Response(detail.data, status=201)
