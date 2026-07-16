"""View for creating a date poll scoped to a game session."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, GameSession
from ...permissions import PollPermission
from ...serializers import PollDetailSerializer, SessionPollCreateSerializer
from ..common import validated_or_error


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via PollPermission.check(), since Polls
# have no public read path, unlike GameSession's own detail view.
@permission_classes([AllowAny])
def session_poll_create(request, game_slug, session_id):
    """Create a date poll attached to a game session, open to the game's DM/players/admins."""
    game = get_object_or_404(Game, game_slug=game_slug)
    session = get_object_or_404(GameSession, id=session_id, game=game)

    error_response = PollPermission.check(request, game)
    if error_response:
        return error_response

    serializer = SessionPollCreateSerializer(
        data=request.data, context={'game': game, 'session': session},
    )
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    poll = serializer.save()
    detail = PollDetailSerializer(poll)
    response = Response(detail.data, status=201)
    response['X-Skip-Cache'] = 'true'
    return response
