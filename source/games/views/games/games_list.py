"""View for listing all games or creating a new one."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, GameMaster
from ...serializers import GameCreateSerializer, GameDetailSerializer, GameListSerializer
from ..common import paginated_list_response, require_authenticated, validated_or_error


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is an intentionally public listing; POST authentication is enforced
# inline inside _create_game so that unauthenticated callers receive a proper 401.
@permission_classes([AllowAny])
def games_list(request):
    """Return a list of all games or create a new game."""
    if request.method == 'POST':
        return _create_game(request)

    return paginated_list_response(request, Game.objects.all(), GameListSerializer)


def _create_game(request):
    """Validate request and create a new game, returning 201 with detail data."""
    error_response = require_authenticated(request)
    if error_response:
        return error_response

    serializer = GameCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    game = serializer.save()
    GameMaster.objects.create(game=game, user=request.user)
    detail = GameDetailSerializer(game)
    return Response(detail.data, status=201)
