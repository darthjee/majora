"""View for listing conversations shared between two players of a game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from conversations.models import Conversation

from ....authentication import CookieTokenAuthentication
from ....models import Game
from ....permissions import PlayerPermission
from ....serializers import ConversationListSerializer
from ...common import paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via PlayerPermission.check(), since
# Conversations have no public read path.
@permission_classes([AllowAny])
def game_conversations(request, game_slug):
    """Return a paginated list of conversations the requester shares with `player_id`."""
    game = get_object_or_404(Game, game_slug=game_slug)

    error_response = PlayerPermission.check(request, game)
    if error_response:
        return error_response

    requesting_player = get_object_or_404(game.players, user=request.user)
    target_player, error_response = _target_player_or_error(game, request)
    if error_response:
        return error_response

    conversations = _shared_conversations(requesting_player, target_player)
    response = paginated_list_response(request, conversations, ConversationListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response


def _target_player_or_error(game, request):
    """Return `(player, None)` for a valid `player_id` query param of `game`.

    Returns `(None, response)` with a 400 Response when `player_id` is missing or not a
    valid integer. A `player_id` that is a valid integer but doesn't belong to `game`
    naturally 404s via `get_object_or_404`.
    """
    player_id = request.query_params.get('player_id')
    if not player_id or not player_id.isdigit():
        error = Response(
            {'errors': {'player_id': ['is required and must be a valid player id']}},
            status=400,
        )
        return None, error
    return get_object_or_404(game.players, id=player_id), None


def _shared_conversations(requesting_player, target_player):
    """Return, most-recent-first, conversations both players participate in."""
    return Conversation.objects.filter(
        participants__player=requesting_player,
    ).filter(
        participants__player=target_player,
    ).distinct().order_by('-id')
