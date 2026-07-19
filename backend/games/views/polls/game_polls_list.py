"""View for listing a game's polls or creating a new one."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...permissions import PollPermission
from ...serializers import PollCreateSerializer, PollDetailSerializer, PollListSerializer
from ..common import paginated_list_response, validated_or_error


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via PollPermission.check(), since Polls
# have no public read path (GET and POST share the same DM/player/admin check).
@permission_classes([AllowAny])
def game_polls_list(request, game_slug):
    """Return a paginated list of a game's polls, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)

    error_response = PollPermission.check(request, game)
    if error_response:
        return error_response

    if request.method == 'POST':
        return _create_poll(request, game)

    return _list_polls(request, game)


def _list_polls(request, game):
    """Filter `game`'s polls by an optional `status` query param, then paginate them."""
    queryset = game.polls.all()
    status = request.query_params.get('status')
    if status is not None:
        queryset = queryset.filter(status=status)

    response = paginated_list_response(request, queryset, PollListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response


def _create_poll(request, game):
    """Validate the request and create a new poll (with options) for the game."""
    serializer = PollCreateSerializer(data=request.data, context={'game': game})
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    poll = serializer.save()
    detail = PollDetailSerializer(poll)
    response = Response(detail.data, status=201)
    response['X-Skip-Cache'] = 'true'
    return response
