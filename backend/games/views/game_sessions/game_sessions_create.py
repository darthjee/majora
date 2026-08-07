"""View for creating a new session for a game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from permissions import EndpointPermission

from ...models import Game
from ...serializers import GameSessionCreateSerializer, GameSessionDetailSerializer
from ..common import validated_or_error


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorization is enforced inline inside _create_session via
# EndpointPermission.check().
@permission_classes([AllowAny])
def game_sessions_create(request, game_slug):
    """Create a new session for the game identified by `game_slug`."""
    game = get_object_or_404(Game, game_slug=game_slug)

    return _create_session(request, game)


def _create_session(request, game):
    """Validate the request and create a new session for the game, returning 201 detail data."""
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_session', 'regular', 'edit',
    )
    if error_response:
        return error_response

    serializer = GameSessionCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    session = serializer.save(game=game)
    detail = GameSessionDetailSerializer(session, context={'request': request})
    return Response(detail.data, status=201)
