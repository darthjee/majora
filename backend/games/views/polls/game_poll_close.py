"""View for closing a game poll, locking in its winning option."""

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game, Poll
from ...permissions import PollClosePermission
from ...poll_close_writer import PollCloseWriter
from ...serializers import PollDetailSerializer


@api_view(['PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via PollClosePermission.check(), since
# closing a poll has no public path.
@permission_classes([AllowAny])
def game_poll_close(request, game_slug, poll_id):
    """Close an open poll, marking its winning option and returning the updated detail."""
    game = get_object_or_404(Game, game_slug=game_slug)
    poll = get_object_or_404(Poll, id=poll_id, game=game)

    error_response = PollClosePermission.check(request, game)
    if error_response:
        return error_response

    try:
        PollCloseWriter.write(poll, option_id=request.data.get('option_id'))
    except ValidationError as exc:
        return Response({'errors': {'detail': exc.messages}}, status=400)

    response = Response(PollDetailSerializer(poll).data)
    response['X-Skip-Cache'] = 'true'
    return response
