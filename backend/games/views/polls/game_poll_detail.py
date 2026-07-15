"""View for showing a single game poll's detail."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, Poll
from ...permissions import PollPermission
from ...serializers import PollDetailSerializer


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via PollPermission.check(), since Polls
# have no public read path.
@permission_classes([AllowAny])
def game_poll_detail(request, game_slug, poll_id):
    """Return a specific poll's detail, including its options."""
    game = get_object_or_404(Game, game_slug=game_slug)
    poll = get_object_or_404(Poll, id=poll_id, game=game)

    error_response = PollPermission.check(request, game)
    if error_response:
        return error_response

    response = Response(PollDetailSerializer(poll).data)
    response['X-Skip-Cache'] = 'true'
    return response
