"""View for searching a game's sessions or creating a new one."""

from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from common.query_filters import filter_by_name
from permissions import EndpointPermission

from ...models import Game
from ...serializers import (
    GameSessionCreateSerializer,
    GameSessionDetailSerializer,
    GameSessionPickSerializer,
)
from ..common import paginated_list_response, validated_or_error


@api_view(['GET', 'POST'])
# AllowAny: GET is public (like past/future/unscheduled); POST authorization is enforced
# inline inside _create_session via EndpointPermission.check().
@permission_classes([AllowAny])
def game_sessions_list(request, game_slug):
    """Return a searchable, paginated list of a game's sessions, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)

    if request.method == 'POST':
        return _create_session(request, game)

    return _search_sessions(request, game)


def _search_sessions(request, game):
    """Return the game's sessions matching the `name` param on title, most recent first."""
    sessions = filter_by_name(request, game.sessions.all(), field='title')
    sessions = sessions.order_by(F('date').desc(nulls_last=True), '-id')
    return paginated_list_response(request, sessions, GameSessionPickSerializer)


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
