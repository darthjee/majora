"""View for listing a game's sessions or creating a new one."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ...permissions import GameSessionEditPermission
from ...serializers import (
    GameSessionCreateSerializer,
    GameSessionDetailSerializer,
    GameSessionListSerializer,
)
from ..common import paginated_list_response, validated_or_error


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; POST authorization is enforced inline
# inside _create_session via GameSessionEditPermission.check().
@permission_classes([AllowAny])
def game_sessions_list(request, game_slug):
    """Return a paginated list of a game's sessions, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)

    if request.method == 'POST':
        return _create_session(request, game)

    return paginated_list_response(request, game.sessions.all(), GameSessionListSerializer)


def _create_session(request, game):
    """Validate the request and create a new session for the game, returning 201 detail data."""
    error_response = GameSessionEditPermission.check(request, game)
    if error_response:
        return error_response

    serializer = GameSessionCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    session = serializer.save(game=game)
    detail = GameSessionDetailSerializer(session, context={'request': request})
    return Response(detail.data, status=201)
