"""View for listing a session's messages or posting a new one."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, GameSession
from ...permissions import SessionMessagePermission
from ...serializers import SessionMessageCreateSerializer, SessionMessageListSerializer
from ...session_message_paginator import SessionMessagePaginator
from ..common import validated_or_error


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via SessionMessagePermission, since
# both GET and POST require the requester to be a player/DM/superuser/staff (view) or a
# player/DM (create) — there is no public read path, unlike GameSession's own detail view.
@permission_classes([AllowAny])
def session_messages_list(request, game_slug, session_id):
    """Return a paginated list of a session's messages, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)
    session = get_object_or_404(GameSession, id=session_id, game=game)

    if request.method == 'POST':
        error_response = SessionMessagePermission.check_create(request, session)
        if error_response:
            return error_response
        return _create_message(request, session)

    error_response = SessionMessagePermission.check_view(request, session)
    if error_response:
        return error_response
    return _list_messages(request, session)


def _list_messages(request, session):
    """Paginate and serialize `session`'s messages, honoring the NEXT-ENTRY-ID cursor."""
    page, headers = SessionMessagePaginator(request, session.messages.all()).paginate()
    serializer = SessionMessageListSerializer(page, many=True)
    headers['X-Skip-Cache'] = 'true'
    return Response(serializer.data, headers=headers)


def _create_message(request, session):
    """Validate the request and create a new message for the session, returning 201 detail."""
    serializer = SessionMessageCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    player = session.game.players.filter(user=request.user).first()
    message = serializer.save(session=session, user=request.user, player=player)
    detail = SessionMessageListSerializer(message)
    response = Response(detail.data, status=201)
    response['X-Skip-Cache'] = 'true'
    return response
