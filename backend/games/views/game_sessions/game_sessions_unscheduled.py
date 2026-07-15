"""View for listing a game's unscheduled (dateless) sessions."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ...models import Game
from ...serializers import GameSessionListSerializer
from ..common import paginated_list_response


@api_view(['GET'])
@permission_classes([AllowAny])
def game_sessions_unscheduled(request, game_slug):
    """Return a paginated list of a game's unscheduled sessions, ordered by id."""
    game = get_object_or_404(Game, game_slug=game_slug)
    sessions = game.sessions.filter(date__isnull=True)

    return paginated_list_response(request, sessions, GameSessionListSerializer)
